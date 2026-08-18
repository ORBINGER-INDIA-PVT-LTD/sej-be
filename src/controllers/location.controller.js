import db from "../models/index.js";

const Location = db.Location;

// Helper to get VendorCode from request
const getVendorCode = (req) =>
  req.user?.VendorCode || req.query.VendorCode || req.body.VendorCode || null;

// Generate a unique 4-digit LocationId
const generateLocationId = async (VendorCode) => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const whereClause = VendorCode ? { LocationId: code, VendorCode } : { LocationId: code };
    const existing = await Location.findOne({ where: whereClause });
    if (!existing) return code;
  }
  throw new Error("Unable to generate a unique LocationId. Please try again.");
};

// Create a new Location
const create = async (req, res) => {
  try {
    const { LocationId, LocationName } = req.body;
    const VendorCode = getVendorCode(req);

    if (!LocationName || !LocationName.toString().trim()) {
      return res.status(400).json({ message: "Location Name is required" });
    }

    const finalLocationId = LocationId
      ? String(LocationId).trim()
      : await generateLocationId(VendorCode);

    const whereClause = VendorCode ? { LocationId: finalLocationId, VendorCode } : { LocationId: finalLocationId };
    const existing = await Location.findOne({ where: whereClause });
    if (existing) {
      return res.status(400).json({ message: `LocationId ${finalLocationId} already exists` });
    }

    const record = await Location.create({
      LocationId: finalLocationId,
      LocationName: LocationName.toString().trim(),
      VendorCode,
      org_id: req.user?.org_id || 1,
    });

    return res.status(201).json({
      message: "Location created successfully",
      data: record,
    });
  } catch (error) {
    console.error("Error creating Location:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get all locations
const getAll = async (req, res) => {
  try {
    const VendorCode = getVendorCode(req);
    const whereClause = VendorCode ? { VendorCode } : {};
    const records = await Location.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Locations fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get single location by ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Location.findByPk(id);

    if (!record) {
      return res.status(404).json({ message: "Location not found" });
    }

    return res.status(200).json({
      message: "Location fetched successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update a location
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { LocationId, LocationName } = req.body;

    const record = await Location.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Location not found" });
    }

    const updates = { updatedAt: new Date() };
    if (LocationId !== undefined && LocationId !== null) {
      const finalLocationId = String(LocationId).trim();
      const whereClause = { LocationId: finalLocationId, id: { [db.Sequelize.Op.ne]: id } };
      const duplicate = await Location.findOne({ where: whereClause });
      if (duplicate) {
        return res.status(400).json({ message: `LocationId ${finalLocationId} already exists` });
      }
      updates.LocationId = finalLocationId;
    }
    if (LocationName !== undefined && LocationName !== null) {
      updates.LocationName = String(LocationName).trim();
    }

    await record.update(updates);

    return res.status(200).json({
      message: "Location updated successfully",
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