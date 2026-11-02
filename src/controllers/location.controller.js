import db from "../models/index.js";

const Location = db.Location;

const resolveVendorCode = async (req) => {
  if (req.user?.VendorCode) return req.user.VendorCode;
  if (req.user?.roleName === "organization" && req.user?.id) {
    const organization = await db.Organization.findByPk(req.user.id, { attributes: ["VendorCode"] });
    return organization?.VendorCode || null;
  }
  return null;
};

const generateLocationId = async (VendorCode) => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const existing = await Location.findOne({ where: { LocationId: code, VendorCode } });
    if (!existing) return code;
  }
  throw new Error("Unable to generate a unique LocationId. Please try again.");
};

const create = async (req, res) => {
  try {
    const { LocationId, LocationName } = req.body;
    const VendorCode = await resolveVendorCode(req);
    if (!VendorCode) return res.status(403).json({ message: "Vendor account is required" });
    if (!LocationName || !LocationName.toString().trim()) {
      return res.status(400).json({ message: "LocationName is required" });
    }

    const finalId = LocationId ? String(LocationId).trim() : await generateLocationId(VendorCode);
    const existing = await Location.findOne({ where: { LocationId: finalId, VendorCode } });
    if (existing) return res.status(400).json({ message: `LocationId ${finalId} already exists for this vendor` });

    const record = await Location.create({
      LocationId: finalId,
      LocationName: LocationName.toString().trim(),
      VendorCode,
      org_id: req.user?.org_id || 1,
    });
    return res.status(201).json({ message: "Location created successfully", data: record });
  } catch (error) {
    console.error("Error creating Location:", error);
    return res.status(500).json({ message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const VendorCode = await resolveVendorCode(req);
    if (!VendorCode) return res.status(403).json({ message: "Vendor account is required" });
    const records = await Location.findAll({
      where: { VendorCode },
      order: [["LocationName", "ASC"]],
    });
    return res.status(200).json({ message: "Locations fetched successfully", data: records });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const VendorCode = await resolveVendorCode(req);
    if (!VendorCode) return res.status(403).json({ message: "Vendor account is required" });
    const record = await Location.findOne({ where: { id: req.params.id, VendorCode } });
    if (!record) return res.status(404).json({ message: "Location not found" });
    return res.status(200).json({ message: "Location fetched successfully", data: record });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const VendorCode = await resolveVendorCode(req);
    if (!VendorCode) return res.status(403).json({ message: "Vendor account is required" });
    const record = await Location.findOne({ where: { id: req.params.id, VendorCode } });
    if (!record) return res.status(404).json({ message: "Location not found" });

    const updates = { updatedAt: new Date() };
    if (req.body.LocationId !== undefined && req.body.LocationId !== null) {
      const finalId = String(req.body.LocationId).trim();
      const duplicate = await Location.findOne({
        where: { LocationId: finalId, VendorCode, id: { [db.Sequelize.Op.ne]: record.id } },
      });
      if (duplicate) return res.status(400).json({ message: `LocationId ${finalId} already exists for this vendor` });
      updates.LocationId = finalId;
    }
    if (req.body.LocationName !== undefined && req.body.LocationName !== null) {
      updates.LocationName = String(req.body.LocationName).trim();
    }
    await record.update(updates);
    return res.status(200).json({ message: "Location updated successfully", data: record });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default { create, getAll, getById, update };
