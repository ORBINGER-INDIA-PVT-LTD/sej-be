import db from "../models/index.js";
import { Op } from "sequelize";
const Role = db.Role;
const User = db.User;
const Organization = db.Organization;
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { normalizeLoginPayload } from "../utils/authPayload.js";
import {
  isAdminCreationAllowed,
  normalizeRegistrationPayload,
} from "../utils/adminRegistration.js";

const register = async (req, res) => {
  try {
    const { emp_id, emp_name, email, password, location, roleName } =
      normalizeRegistrationPayload(req.body);

    if (!emp_id || !emp_name || !email || !password) {
      return res.status(400).json({
        message: "emp_id (Employee ID), emp_name (Employee Name), email and password are required",
      });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { emp_id }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (existingUser.emp_id === emp_id) {
        return res.status(400).json({ message: "Employee ID already exists" });
      }
    }

    // Find or create role dynamically
    const [targetRole] = await Role.findOrCreate({
      where: { role_name: roleName },
      defaults: { role_name: roleName },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Resolve VendorCode and org_id from token or request body
    let VendorCode = req.body.VendorCode || null;
    let org_id = req.body.org_id || null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded) {
          VendorCode = VendorCode || decoded.VendorCode || null;
          if (decoded.role && decoded.role.toString().toLowerCase() === "organization") {
            org_id = decoded.id;
          } else {
            org_id = org_id || decoded.org_id || null;
          }
        }
      } catch (err) {
        // Ignore token decode errors
      }
    }

    // Lookup by VendorCode if org_id not resolved
    if (!org_id && VendorCode) {
      const org = await Organization.findOne({ where: { VendorCode } });
      if (org) org_id = org.id;
    }

    if (!org_id) org_id = 1;

    const user = await User.create({
      emp_id,
      emp_name,
      email,
      password: hashedPassword,
      location,
      role_id: targetRole.id,
      org_id,
      VendorCode,
    });

    const userWithRole = await User.findByPk(user.id, {
      include: [{ model: Role }],
      attributes: { exclude: ["password"] },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: userWithRole,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = normalizeLoginPayload(req.body);

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Email/Emp ID and password are required" });
    }

    // Find user by email OR emp_id
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { emp_id: identifier }],
      },
      include: [{ model: Role }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Include VendorCode in JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role_id,
        org_id: user.org_id || 1,
        VendorCode: user.VendorCode || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const organizationData = await Organization.findAll();

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        ...user.toJSON(),
        password: undefined,
      },
      organizationData,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = normalizeLoginPayload(req.body);

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Email/Emp ID and password are required" });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { emp_id: identifier }],
      },
      include: [{ model: Role }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const adminRole = user.role?.role_name?.toLowerCase();
    if (adminRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role_id,
        org_id: user.org_id || 1,
        VendorCode: user.VendorCode || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const organizationData = await Organization.findAll();

    return res.status(200).json({
      message: "Admin login successful",
      token,
      user,
      organizationData,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all users filtered by VendorCode
const getAllUsers = async (req, res) => {
  try {
    const VendorCode = req.user?.VendorCode || req.query.VendorCode || null;
    const whereClause = VendorCode ? { VendorCode } : {};

    const users = await User.findAll({
      where: whereClause,
      include: [{ model: Role, attributes: ["id", "role_name"] }],
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.destroy();
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { emp_name, emp_id, email, password, location, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (emp_name) user.emp_name = emp_name;
    if (emp_id) user.emp_id = emp_id;
    if (email) user.email = email;
    if (location) user.location = location;
    
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (role) {
      const roleRecord = await Role.findOne({ where: { role_name: role.toLowerCase() } });
      if (roleRecord) {
        user.role_id = roleRecord.id;
      }
    }

    await user.save();
    return res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default {
  register,
  login,
  adminLogin,
  getAllUsers,
  deleteUser,
  updateUser,
};
