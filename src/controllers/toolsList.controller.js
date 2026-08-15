import db from "../models/index.js";

const ToolsList = db.ToolsList;
const ToolsListItem = db.ToolsListItem;
const User = db.User;

// Helper to get VendorCode from request
const getVendorCode = (req) =>
  req.user?.VendorCode || req.query.VendorCode || req.body.VendorCode || null;

// Create new ToolsList entry
const create = async (req, res) => {
  try {
    const { 
      permitNumber, 
      date, 
      typeOfWork, 
      nameOfSupervisor, 
      sopNumber, 
      jobDescription, 
      tools,
      employeeId
    } = req.body;
    const user_id = req.user.id;
    const VendorCode = getVendorCode(req);

    // Create parent record
    const record = await ToolsList.create({
      user_id,
      employee_id: employeeId,
      permit_number: permitNumber,
      date,
      type_of_work: typeOfWork,
      name_of_supervisor: nameOfSupervisor,
      sop_number: sopNumber,
      job_description: jobDescription,
      org_id: req.user?.org_id || 1,
      VendorCode,
    });

    // Create child records if tools are present
    let parsedTools = [];
    if (typeof tools === "string") {
      try {
        parsedTools = JSON.parse(tools);
      } catch (err) {
        parsedTools = [];
      }
    } else if (Array.isArray(tools)) {
      parsedTools = tools;
    }

    if (parsedTools && parsedTools.length > 0) {
      const items = parsedTools.map((t) => ({
        tools_list_id: record.id,
        tool_name: t.toolName || "Unknown Tool",
        checklist_points: t.checklistPoints || [],
        other: t.other || "",
        description: t.description || "",
        status: t.status || "",
        after_report: t.afterReport || t.after_report || null,
        after_report_date: t.afterReportDate || t.after_report_date || null
      }));

      await ToolsListItem.bulkCreate(items);
    }

    const createdRecord = await ToolsList.findByPk(record.id, {
      include: [
        { model: ToolsListItem, as: "tools" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email", "location"] },
      ],
    });

    return res.status(201).json({
      message: "ToolsList record created successfully",
      data: createdRecord,
    });
  } catch (error) {
    console.error("Error creating ToolsList:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get current user's records
const getMyRecords = async (req, res) => {
  try {
    const user_id = req.user.id;
    const VendorCode = getVendorCode(req);
    const whereClause = VendorCode ? { user_id, VendorCode } : { user_id };
    const records = await ToolsList.findAll({
      where: whereClause,
      include: [
        { model: ToolsListItem, as: "tools" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email", "location"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "ToolsList records fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all records
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
    const records = await ToolsList.findAll({
      where: whereClause,
      include: [
        { model: ToolsListItem, as: "tools" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email", "location"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "All ToolsList records fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get records by employee ID (empId)
const getByEmpId = async (req, res) => {
  try {
    const { empId } = req.params;
    const records = await ToolsList.findAll({
      where: { employee_id: empId },
      include: [
        { model: ToolsListItem, as: "tools" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email", "location"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: `ToolsList records for employee ${empId} fetched successfully`,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get single record by ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const userRole = req.user.roleName || "";
    const isAdmin = ["admin", "administrator", "organization"].includes(userRole.toLowerCase());

    const record = await ToolsList.findByPk(id, {
      include: [
        { model: ToolsListItem, as: "tools" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email", "location"] },
      ],
    });

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({
      message: "ToolsList record fetched successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update record
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      permitNumber, 
      date, 
      typeOfWork, 
      nameOfSupervisor, 
      sopNumber, 
      jobDescription, 
      tools,
      employeeId
    } = req.body;
    const user_id = req.user.id;
    const userRole = req.user.roleName || "";
    const isAdmin = ["admin", "administrator", "organization"].includes(userRole.toLowerCase());

    const record = await ToolsList.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await record.update({
      employee_id: employeeId,
      permit_number: permitNumber,
      date,
      type_of_work: typeOfWork,
      name_of_supervisor: nameOfSupervisor,
      sop_number: sopNumber,
      job_description: jobDescription,
      updatedAt: new Date()
    });

    // Remove old child records
    await ToolsListItem.destroy({ where: { tools_list_id: id } });

    // Create updated child records
    let parsedTools = [];
    if (typeof tools === "string") {
      try {
        parsedTools = JSON.parse(tools);
      } catch (err) {
        parsedTools = [];
      }
    } else if (Array.isArray(tools)) {
      parsedTools = tools;
    }

    if (parsedTools && parsedTools.length > 0) {
      const items = parsedTools.map((t) => ({
        tools_list_id: id,
        tool_name: t.toolName || t.tool_name || "Unknown Tool",
        checklist_points: t.checklistPoints || t.checklist_points || [],
        other: t.other || "",
        description: t.description || "",
        status: t.status || "",
        after_report: t.afterReport || t.after_report || null,
        after_report_date: t.afterReportDate || t.after_report_date || null
      }));

      await ToolsListItem.bulkCreate(items);
    }

    return res.status(200).json({ message: "ToolsList record updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete record
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const userRole = req.user.roleName || "";
    const isAdmin = ["admin", "administrator", "organization"].includes(userRole.toLowerCase());

    const record = await ToolsList.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete children
    await ToolsListItem.destroy({ where: { tools_list_id: id } });
    
    // Delete parent
    await record.destroy();

    return res.status(200).json({ message: "ToolsList record deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default {
  create,
  getMyRecords,
  getAll,
  getByEmpId,
  getById,
  update,
  remove,
};
