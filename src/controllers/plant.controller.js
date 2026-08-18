import db from "../models/index.js";

const Plant = db.Plant;

// Helper to get VendorCode from request
const getVendorCode = (req) =>
  req.user?.VendorCode || req.query.VendorCode || req.body.VendorCode || null;

// Generate a unique 4-digit PlantId
const generatePlantId = async (VendorCode) => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const whereClause = VendorCode ? { PlantId: code, VendorCode } : { PlantId: code };
    const existing = await Plant.findOne({ where: whereClause });
    if (!existing) return code;
  }
  throw new Error("Unable to generate a unique PlantId. Please try again.");
};

// Create a new Plant
const create = async (req, res) => {
  try {
    const { PlantId, PlantName } = req.body;
    const VendorCode = getVendorCode(req);

    if (!PlantName || !PlantName.toString().trim()) {
      return res.status(400).json({ message: "Plant Name is required" });
    }

    const finalPlantId = PlantId
      ? String(PlantId).trim()
      : await generatePlantId(VendorCode);

    const whereClause = VendorCode ? { PlantId: finalPlantId, VendorCode } : { PlantId: finalPlantId };
    const existing = await Plant.findOne({ where: whereClause });
    if (existing) {
      return res.status(400).json({ message: `PlantId ${finalPlantId} already exists` });
    }

    const record = await Plant.create({
      PlantId: finalPlantId,
      PlantName: PlantName.toString().trim(),
      VendorCode,
      org_id: req.user?.org_id || 1,
    });

    return res.status(201).json({
      message: "Plant created successfully",
      data: record,
    });
  } catch (error) {
    console.error("Error creating Plant:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get all plants
const getAll = async (req, res) => {
  try {
    const VendorCode = getVendorCode(req);
    const whereClause = VendorCode ? { VendorCode } : {};
    const records = await Plant.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Plants fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get single plant by ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Plant.findByPk(id);

    if (!record) {
      return res.status(404).json({ message: "Plant not found" });
    }

    return res.status(200).json({
      message: "Plant fetched successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update a plant
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { PlantId, PlantName } = req.body;

    const record = await Plant.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Plant not found" });
    }

    const updates = { updatedAt: new Date() };
    if (PlantId !== undefined && PlantId !== null) {
      const finalPlantId = String(PlantId).trim();
      const whereClause = { PlantId: finalPlantId, id: { [db.Sequelize.Op.ne]: id } };
      const duplicate = await Plant.findOne({ where: whereClause });
      if (duplicate) {
        return res.status(400).json({ message: `PlantId ${finalPlantId} already exists` });
      }
      updates.PlantId = finalPlantId;
    }
    if (PlantName !== undefined && PlantName !== null) {
      updates.PlantName = String(PlantName).trim();
    }

    await record.update(updates);

    return res.status(200).json({
      message: "Plant updated successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default {
  create,
  getAll,
  getById,
  update,
};