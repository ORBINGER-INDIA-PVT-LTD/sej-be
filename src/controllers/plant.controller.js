import db from "../models/index.js";

const Plant = db.Plant;

const resolveVendorCode = async (req) => {
  if (req.user?.VendorCode) return req.user.VendorCode;
  if (req.user?.roleName === "organization" && req.user?.id) {
    const organization = await db.Organization.findByPk(req.user.id, { attributes: ["VendorCode"] });
    return organization?.VendorCode || null;
  }
  return null;
};

const generatePlantId = async (VendorCode) => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const existing = await Plant.findOne({ where: { PlantId: code, VendorCode } });
    if (!existing) return code;
  }
  throw new Error("Unable to generate a unique PlantId. Please try again.");
};

const create = async (req, res) => {
  try {
    const { PlantId, PlantName } = req.body;
    const VendorCode = await resolveVendorCode(req);
    if (!VendorCode) return res.status(403).json({ message: "Vendor account is required" });
    if (!PlantName || !PlantName.toString().trim()) {
      return res.status(400).json({ message: "PlantName is required" });
    }

    const finalId = PlantId ? String(PlantId).trim() : await generatePlantId(VendorCode);
    const existing = await Plant.findOne({ where: { PlantId: finalId, VendorCode } });
    if (existing) return res.status(400).json({ message: `PlantId ${finalId} already exists for this vendor` });

    const record = await Plant.create({
      PlantId: finalId,
      PlantName: PlantName.toString().trim(),
      VendorCode,
      org_id: req.user?.org_id || 1,
    });
    return res.status(201).json({ message: "Plant created successfully", data: record });
  } catch (error) {
    console.error("Error creating Plant:", error);
    return res.status(500).json({ message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const VendorCode = await resolveVendorCode(req);
    if (!VendorCode) return res.status(403).json({ message: "Vendor account is required" });
    const records = await Plant.findAll({
      where: { VendorCode },
      order: [["PlantName", "ASC"]],
    });
    return res.status(200).json({ message: "Plants fetched successfully", data: records });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const VendorCode = await resolveVendorCode(req);
    if (!VendorCode) return res.status(403).json({ message: "Vendor account is required" });
    const record = await Plant.findOne({ where: { id: req.params.id, VendorCode } });
    if (!record) return res.status(404).json({ message: "Plant not found" });
    return res.status(200).json({ message: "Plant fetched successfully", data: record });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const VendorCode = await resolveVendorCode(req);
    if (!VendorCode) return res.status(403).json({ message: "Vendor account is required" });
    const record = await Plant.findOne({ where: { id: req.params.id, VendorCode } });
    if (!record) return res.status(404).json({ message: "Plant not found" });

    const updates = { updatedAt: new Date() };
    if (req.body.PlantId !== undefined && req.body.PlantId !== null) {
      const finalId = String(req.body.PlantId).trim();
      const duplicate = await Plant.findOne({
        where: { PlantId: finalId, VendorCode, id: { [db.Sequelize.Op.ne]: record.id } },
      });
      if (duplicate) return res.status(400).json({ message: `PlantId ${finalId} already exists for this vendor` });
      updates.PlantId = finalId;
    }
    if (req.body.PlantName !== undefined && req.body.PlantName !== null) {
      updates.PlantName = String(req.body.PlantName).trim();
    }
    await record.update(updates);
    return res.status(200).json({ message: "Plant updated successfully", data: record });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default { create, getAll, getById, update };
