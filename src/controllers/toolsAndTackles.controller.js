import db from "../models/index.js";

const ToolsAndTackles = db.ToolsAndTackles;
const ToolStatus = db.ToolStatus;
const User = db.User;

// Helper to get VendorCode from request
const getVendorCode = (req) =>
  req.user?.VendorCode || req.query?.VendorCode || req.body?.VendorCode || null;

// Helper to normalize location into an array
const normalizeLocations = (loc) => {
  if (!loc) return ["All"];
  if (Array.isArray(loc)) {
    let cleaned = loc.map((l) => (typeof l === "string" ? l.trim() : l)).filter(Boolean);
    if (cleaned.length > 1 && cleaned.includes("All")) {
      cleaned = cleaned.filter((l) => l !== "All");
    }
    return cleaned.length > 0 ? cleaned : ["All"];
  }
  if (typeof loc === "string") {
    try {
      const parsed = JSON.parse(loc);
      if (Array.isArray(parsed)) {
        let cleaned = parsed.map((l) => (typeof l === "string" ? l.trim() : l)).filter(Boolean);
        if (cleaned.length > 1 && cleaned.includes("All")) {
          cleaned = cleaned.filter((l) => l !== "All");
        }
        return cleaned.length > 0 ? cleaned : ["All"];
      }
    } catch (e) {
      let parts = loc.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length > 1 && parts.includes("All")) {
        parts = parts.filter((l) => l !== "All");
      }
      return parts.length > 0 ? parts : ["All"];
    }
    return loc.trim() ? [loc.trim()] : ["All"];
  }
  return ["All"];
};

// Create a new tools and tackles checklist
const create = async (req, res) => {
  try {
    const {
      permit_no,
      date,
      type_of_work,
      name_of_supervisor,
      sop_number,
      job_description,
      status,
      location,
      toolTackles,
    } = req.body;

    const user_id = req.user.id;
    const VendorCode = getVendorCode(req);
    const finalPermitNo = permit_no || `PERMIT-${Date.now()}`;

    // Parse child records if toolTackles is present
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

    // Determine parent location from body or derived from tools
    let parentLocation = location;
    if (!parentLocation && parsedTools && parsedTools.length > 0) {
      const allLocs = Array.from(
        new Set(
          parsedTools.flatMap((t) => normalizeLocations(t.locations || t.location))
        )
      );
      parentLocation = allLocs.includes("All") && allLocs.length === 1
        ? "All"
        : allLocs.filter((l) => l !== "All").join(", ") || "All";
    }

    const finalLocation = Array.isArray(parentLocation)
      ? (parentLocation.length > 1 && parentLocation.includes("All") ? parentLocation.filter(l => l !== "All").join(", ") : parentLocation.join(", "))
      : (parentLocation || "All");

    // Create parent record
    const record = await ToolsAndTackles.create({
      permit_no: finalPermitNo,
      date: date || new Date(),
      type_of_work: type_of_work || "Tools and Tackles Checklist",
      name_of_supervisor: name_of_supervisor || req.user.emp_name || "Supervisor",
      sop_number: sop_number || "SOP-001",
      job_description: job_description || "Tools & Tackles Checklist Points",
      status: status || "Pending",
      location: finalLocation,
      user_id,
      org_id: req.user?.org_id || 1,
      VendorCode,
    });

    if (parsedTools && parsedTools.length > 0) {
      const statusRecords = parsedTools.map((tool) => {
        const toolLocs = normalizeLocations(tool.locations || tool.location || parentLocation);
        return {
          tools_and_tackles_id: record.id,
          tool_name: tool.toolName || tool.tool_name || "Unknown Tool",
          tool_type: tool.toolType || tool.tool_type || "Machine Tool",
          plant: tool.plant || "All",
          location: toolLocs,
          tool_status: "Pending", // Default overall status
          tool_checklist: tool.toolChecklist || tool.tool_checklist || tool.points || [],
        };
      });

      await ToolStatus.bulkCreate(statusRecords);
    }

    // Retrieve full created checklist with association
    const createdChecklist = await ToolsAndTackles.findByPk(record.id, {
      include: [
        { model: ToolStatus, as: "tools_status" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
    });

    return res.status(201).json({
      message: "Tools and tackles checklist created successfully",
      data: createdChecklist,
    });
  } catch (error) {
    console.error("Error creating tools and tackles checklist:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Filter records helper for query parameters (location, plant)
const filterRecordsByQuery = (records, location, plant) => {
  let result = records;

  if (location && location !== "All") {
    result = result.filter((rec) => {
      const statuses = rec.tools_status || [];
      return statuses.some((st) => {
        const locs = normalizeLocations(st.location);
        return locs.includes("All") || locs.includes(location);
      });
    });
  }

  if (plant && plant !== "All") {
    result = result.filter((rec) => {
      const statuses = rec.tools_status || [];
      return statuses.some((st) => !st.plant || st.plant === "All" || st.plant === plant);
    });
  }

  return result;
};

// Get my checklists
const getMyRecords = async (req, res) => {
  try {
    const user_id = req.user.id;
    const VendorCode = getVendorCode(req);
    const { location, plant } = req.query;
    const whereClause = VendorCode ? { user_id, VendorCode } : { user_id };
    const records = await ToolsAndTackles.findAll({
      where: whereClause,
      include: [
        { model: ToolStatus, as: "tools_status" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const filtered = filterRecordsByQuery(records, location, plant);

    return res.status(200).json({
      message: "Tools and tackles checklists fetched successfully",
      data: filtered,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all checklists (Admin)
const getAll = async (req, res) => {
  try {
    const userRole = req.user.roleName || "";
    // Admin check
    const isAdmin = ["admin", "administrator", "organization"].includes(userRole.toLowerCase());
    
    // In case roleName wasn't loaded:
    let isRoleAdmin = false;
    let isRoleEmployee = false;
    if (req.user.role) {
      const userRoleRecord = await db.Role.findByPk(req.user.role);
      if (userRoleRecord) {
        const name = (userRoleRecord.role_name || "").toLowerCase();
        if (["admin", "administrator", "organization"].includes(name)) {
          isRoleAdmin = true;
        } else if (["employee", "incharge", "supervisor", "safety supervisor"].includes(name)) {
          isRoleEmployee = true;
        }
      }
    }

    const isEmployee = ["employee", "incharge", "supervisor", "safety supervisor"].includes(userRole.toLowerCase());

    if (!isAdmin && !isRoleAdmin && !isEmployee && !isRoleEmployee) {
      return res.status(403).json({ message: "Access denied" });
    }

    const VendorCode = getVendorCode(req);
    const { location, plant } = req.query;
    const whereClause = VendorCode ? { VendorCode } : {};
    const records = await ToolsAndTackles.findAll({
      where: whereClause,
      include: [
        { model: ToolStatus, as: "tools_status" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const filtered = filterRecordsByQuery(records, location, plant);

    return res.status(200).json({
      message: "All tools and tackles checklists fetched successfully",
      data: filtered,
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

    const record = await ToolsAndTackles.findByPk(id, {
      include: [
        { model: ToolStatus, as: "tools_status" },
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
      message: "Tools and tackles checklist fetched successfully",
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
    const { location, toolTackles } = req.body;
    const user_id = req.user.id;
    const userRole = req.user.roleName || "";
    const isAdmin = ["admin", "administrator", "organization"].includes(userRole.toLowerCase());

    const record = await ToolsAndTackles.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Parse updated tools
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

    let parentLocation = location;
    if (!parentLocation && parsedTools && parsedTools.length > 0) {
      const allLocs = Array.from(
        new Set(
          parsedTools.flatMap((t) => normalizeLocations(t.locations || t.location))
        )
      );
      parentLocation = allLocs.includes("All") && allLocs.length === 1
        ? "All"
        : allLocs.filter((l) => l !== "All").join(", ") || "All";
    }

    const finalLocation = parentLocation
      ? (Array.isArray(parentLocation) ? (parentLocation.length > 1 && parentLocation.includes("All") ? parentLocation.filter(l => l !== "All").join(", ") : parentLocation.join(", ")) : parentLocation)
      : record.location;

    await record.update({ location: finalLocation, updatedAt: new Date() });

    // Remove old child statuses
    await ToolStatus.destroy({ where: { tools_and_tackles_id: id } });

    // Create updated child statuses
    if (parsedTools && parsedTools.length > 0) {
      const statusRecords = parsedTools.map((tool) => {
        const toolLocs = normalizeLocations(tool.locations || tool.location || parentLocation);
        return {
          tools_and_tackles_id: id,
          tool_name: tool.toolName || tool.tool_name || "Unknown Tool",
          tool_type: tool.toolType || tool.tool_type || "Machine Tool",
          plant: tool.plant || "All",
          location: toolLocs,
          tool_status: "Pending",
          tool_checklist: tool.toolChecklist || tool.tool_checklist || tool.points || [],
        };
      });

      await ToolStatus.bulkCreate(statusRecords);
    }

    const updatedChecklist = await ToolsAndTackles.findByPk(id, {
      include: [
        { model: ToolStatus, as: "tools_status" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
    });

    return res.status(200).json({ message: "Checklist updated successfully", data: updatedChecklist });
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

    const record = await ToolsAndTackles.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete children
    await ToolStatus.destroy({ where: { tools_and_tackles_id: id } });
    
    // Delete parent
    await record.destroy();

    return res.status(200).json({ message: "Checklist deleted successfully" });
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
