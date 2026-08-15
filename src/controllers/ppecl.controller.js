import db from "../models/index.js";

const Ppecl = db.Ppecl;
const PpeclStatus = db.PpeclStatus;
const User = db.User;

// Helper to get VendorCode from request
const getVendorCode = (req) =>
  req.user?.VendorCode || req.query.VendorCode || req.body.VendorCode || null;

// Create a new PPECL checklist
const create = async (req, res) => {
  try {
    const { toolTackles } = req.body;
    const user_id = req.user.id;
    const VendorCode = getVendorCode(req);

    // Create parent record
    const record = await Ppecl.create({
      user_id,
      org_id: req.user?.org_id || 1,
      VendorCode,
    });

    // Parse and create child records if toolTackles is present
    let parsedTools = [];
    if (typeof toolTackles === "string") {
      try {
        parsedTools = JSON.parse(toolTackles);
      } catch (err) {
        parsedTools = [];
      }
    } else if (Array.isArray(toolTackles)) {
      parsedTools = toolTackles;
    }

    if (parsedTools && parsedTools.length > 0) {
      const statusRecords = parsedTools.map((tool) => ({
        ppecl_id: record.id,
        tool_name: tool.toolName || "Unknown Item",
        tool_checklist: tool.toolChecklist || [],
      }));

      await PpeclStatus.bulkCreate(statusRecords);
    }

    // Retrieve full created checklist with association
    const createdChecklist = await Ppecl.findByPk(record.id, {
      include: [
        { model: PpeclStatus, as: "ppecl_status" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
    });

    return res.status(201).json({
      message: "PPECL checklist created successfully",
      data: createdChecklist,
    });
  } catch (error) {
    console.error("Error creating ppecl checklist:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get my checklists
const getMyRecords = async (req, res) => {
  try {
    const user_id = req.user.id;
    const VendorCode = getVendorCode(req);
    const whereClause = VendorCode ? { user_id, VendorCode } : { user_id };
    const records = await Ppecl.findAll({
      where: whereClause,
      include: [
        { model: PpeclStatus, as: "ppecl_status" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "PPECL checklists fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all checklists (Admin)
const getAll = async (req, res) => {
  try {
    const userRole = req.user.roleName || "";
    const isAdmin = ["admin", "administrator", "organization"].includes(userRole.toLowerCase());
    
    let isRoleAdmin = false;
    let isRoleEmployee = false;
    if (req.user.role) {
      const userRoleRecord = await db.Role.findByPk(req.user.role);
      if (userRoleRecord) {
        const name = (userRoleRecord.role_name || "").toLowerCase();
        if (["admin", "administrator", "organization"].includes(name)) {
          isRoleAdmin = true;
        } else if (["employee", "incharge"].includes(name)) {
          isRoleEmployee = true;
        }
      }
    }

    const isEmployee = ["employee", "incharge"].includes(userRole.toLowerCase());

    if (!isAdmin && !isRoleAdmin && !isEmployee && !isRoleEmployee) {
      return res.status(403).json({ message: "Access denied" });
    }

    const VendorCode = getVendorCode(req);
    const whereClause = VendorCode ? { VendorCode } : {};
    const records = await Ppecl.findAll({
      where: whereClause,
      include: [
        { model: PpeclStatus, as: "ppecl_status" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "All PPECL fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get single checklist by ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const userRole = req.user.roleName || "";
    const isAdmin = ["admin", "administrator", "organization"].includes(userRole.toLowerCase());

    const record = await Ppecl.findByPk(id, {
      include: [
        { model: PpeclStatus, as: "ppecl_status" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
    });

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({
      message: "PPECL checklist fetched successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update checklist
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { toolTackles } = req.body;
    const user_id = req.user.id;
    const userRole = req.user.roleName || "";
    const isAdmin = ["admin", "administrator", "organization"].includes(userRole.toLowerCase());

    const record = await Ppecl.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await record.update({ updatedAt: new Date() });

    // Remove old child statuses
    await PpeclStatus.destroy({ where: { ppecl_id: id } });

    // Create updated child statuses
    let parsedTools = [];
    if (typeof toolTackles === "string") {
      try {
        parsedTools = JSON.parse(toolTackles);
      } catch (err) {
        parsedTools = [];
      }
    } else if (Array.isArray(toolTackles)) {
      parsedTools = toolTackles;
    }

    if (parsedTools && parsedTools.length > 0) {
      const statusRecords = parsedTools.map((tool) => ({
        ppecl_id: id,
        tool_name: tool.toolName || "Unknown Item",
        tool_checklist: tool.toolChecklist || tool.points || [],
      }));

      await PpeclStatus.bulkCreate(statusRecords);
    }

    return res.status(200).json({ message: "PPECL updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete a checklist
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const userRole = req.user.roleName || "";
    const isAdmin = ["admin", "administrator", "organization"].includes(userRole.toLowerCase());

    const record = await Ppecl.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete children
    await PpeclStatus.destroy({ where: { ppecl_id: id } });
    
    // Delete parent
    await record.destroy();

    return res.status(200).json({ message: "PPECL deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default {
  create,
  getMyRecords,
  getAll,
  getById,
  update,
  remove,
};
