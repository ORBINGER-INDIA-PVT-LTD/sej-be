import db from "../models/index.js";
import { uploadToS3 } from "../services/upload.service.js";
import jwt from "jsonwebtoken";

const Organization = db.Organization;

export const registerOrganization = async (req, res) => {
  try {
    const { OrgName, VendorCode, OrgAddress, email, contactNumber, password, role } = req.body;

    if (!OrgName || !VendorCode || !OrgAddress || !email || !contactNumber || !password) {
      return res.status(400).json({
        message: "OrgName, VendorCode, OrgAddress, email, contactNumber, and password are required",
      });
    }

    // Check unique constraints (email and VendorCode)
    const existingOrgByEmail = await Organization.findOne({ where: { email } });
    if (existingOrgByEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const existingOrgByVendorCode = await Organization.findOne({ where: { VendorCode } });
    if (existingOrgByVendorCode) {
      return res.status(400).json({ message: "VendorCode already exists" });
    }

    let logoUrl = null;
    // Handle logo file upload via S3 if file is sent (using req.file from multer)
    if (req.file) {
      const uploadResult = await uploadToS3(req.file, "logos");
      if (uploadResult.status) {
        logoUrl = uploadResult.url;
      } else {
        return res.status(500).json({ message: "Failed to upload Organization Logo to S3" });
      }
    }

    // Create organization with NO HASH password
    const newOrg = await Organization.create({
      OrgName,
      VendorCode,
      OrgLogo: logoUrl,
      OrgAddress,
      email,
      contactNumber,
      password, // NO HASH (plain text password as requested)
      role: role || "organization",
    });

    return res.status(201).json({
      message: "Organization registered successfully",
      data: {
        id: newOrg.id,
        OrgName: newOrg.OrgName,
        VendorCode: newOrg.VendorCode,
        OrgLogo: newOrg.OrgLogo,
        OrgAddress: newOrg.OrgAddress,
        email: newOrg.email,
        contactNumber: newOrg.contactNumber,
        role: newOrg.role,
        createdAt: newOrg.createdAt,
      }
    });

  } catch (err) {
    console.error("Org registration error:", err);
    return res.status(500).json({
      message: "Internal server error occurred during organization registration",
      error: err.message,
    });
  }
};

export const loginOrganization = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the organization
    const org = await Organization.findOne({ where: { email } });
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Direct password match (NO HASH)
    if (password !== org.password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Sign JWT token
    const token = jwt.sign(
      {
        id: org.id,
        role: org.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      organization: {
        id: org.id,
        OrgName: org.OrgName,
        VendorCode: org.VendorCode,
        OrgLogo: org.OrgLogo,
        OrgAddress: org.OrgAddress,
        email: org.email,
        contactNumber: org.contactNumber,
        password: org.password, // Plain text password in response
        role: org.role,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      }
    });

  } catch (err) {
    console.error("Org login error:", err);
    return res.status(500).json({
      message: "Internal server error occurred during organization login",
      error: err.message,
    });
  }
};

export const getAllOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.findAll();
    return res.status(200).json({
      message: "Organizations retrieved successfully",
      organizations
    });
  } catch (err) {
    console.error("Fetch all organizations error:", err);
    return res.status(500).json({
      message: "Internal server error occurred while fetching organizations",
      error: err.message,
    });
  }
};

export const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { OrgName, VendorCode, OrgAddress, email, contactNumber, password } = req.body;

    const org = await Organization.findByPk(id);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    if (email && email !== org.email) {
      const existingEmail = await Organization.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      org.email = email;
    }

    if (VendorCode && VendorCode !== org.VendorCode) {
      const existingVendor = await Organization.findOne({ where: { VendorCode } });
      if (existingVendor) {
        return res.status(400).json({ message: "VendorCode already exists" });
      }
      org.VendorCode = VendorCode;
    }

    if (OrgName) org.OrgName = OrgName;
    if (OrgAddress) org.OrgAddress = OrgAddress;
    if (contactNumber) org.contactNumber = contactNumber;
    if (password) org.password = password;

    if (req.file) {
      const uploadResult = await uploadToS3(req.file, "logos");
      if (uploadResult.status) {
        org.OrgLogo = uploadResult.url;
      } else {
        return res.status(500).json({ message: "Failed to upload Organization Logo to S3" });
      }
    }

    await org.save();

    return res.status(200).json({
      message: "Organization updated successfully",
      data: {
        id: org.id,
        OrgName: org.OrgName,
        VendorCode: org.VendorCode,
        OrgLogo: org.OrgLogo,
        OrgAddress: org.OrgAddress,
        email: org.email,
        contactNumber: org.contactNumber,
        role: org.role,
        updatedAt: org.updatedAt,
      }
    });

  } catch (err) {
    console.error("Org update error:", err);
    return res.status(500).json({
      message: "Internal server error occurred during organization update",
      error: err.message,
    });
  }
};
