import db from "../models/index.js";
import { uploadToS3 } from "../services/upload.service.js";

const ToolBoxTackle = db.ToolBoxTackle;
const ToolBoxTackleAction = db.ToolBoxTackleAction;
const User = db.User;

const FOLDER = "uploads";

// Helper to get VendorCode from request
const getVendorCode = (req) =>
  req.user?.VendorCode || req.query.VendorCode || req.body.VendorCode || null;

const parseJsonArray = (value, fallback = []) => {
  if (value == null) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

// Create a new tool box tackle with action items
const create = async (req, res) => {
  try {
    const {
      date,
      section,
      department,
      company_supervisor,
      safety_representative,
      contractor_representative,
      contract_employees,
      point_discussed,
      general_safety_items,
      safety_interest_items,
      standard_operating_procedures,
      employee_reminders,
      safety_message_handouts,
      action_items,
      employees,
      employes,
    } = req.body;

    // Get user_id from authenticated user (JWT)
    const user_id = req.user.id;

    // Upload group photo to S3 first (do not save record if upload fails)
    let employee_group_photo = "";
    if (req.file) {
      const uploadResult = await uploadToS3(req.file, FOLDER);
      if (!uploadResult.status) {
        return res.status(400).json({
          message: "Image upload failed",
          error: "employee_group_photo upload failed",
        });
      }
      employee_group_photo = uploadResult.url;
    }

    const parsedEmployees = Array.isArray(employees)
      ? employees
      : Array.isArray(employes)
        ? employes
        : parseJsonArray(employees, parseJsonArray(employes, []));

    const parsedActionItems = parseJsonArray(action_items, []);

    const VendorCode = getVendorCode(req);

    // Create the tool box tackle
    const toolBoxTackle = await ToolBoxTackle.create({
      date: date || new Date(),
      section,
      department,
      company_supervisor,
      safety_representative,
      contractor_representative,
      contract_employees,
      point_discussed,
      general_safety_items,
      safety_interest_items,
      standard_operating_procedures,
      employee_reminders,
      safety_message_handouts,
      employees: parsedEmployees,
      employee_group_photo,
      user_id,
      org_id: req.user?.org_id || 1,
      VendorCode,
    });

    // Create action items if provided (Point 7)
    if (parsedActionItems && parsedActionItems.length > 0) {
      const actionRecords = parsedActionItems.map((action) => ({
        item: action.item,
        action_by: action.action_by,
        when: action.when,
        tool_box_tackle_id: toolBoxTackle.id,
      }));

      await ToolBoxTackleAction.bulkCreate(actionRecords);
    }

    // Fetch the complete record with action items
    const result = await ToolBoxTackle.findByPk(toolBoxTackle.id, {
      include: [
        { model: ToolBoxTackleAction, as: "action_items" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
    });

    return res.status(201).json({
      message: "Tool Box Tackle created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all tool box tackles for the logged-in employee
const getMyRecords = async (req, res) => {
  try {
    const user_id = req.user.id;
    const VendorCode = getVendorCode(req);
    const whereClause = VendorCode ? { user_id, VendorCode } : { user_id };

    const records = await ToolBoxTackle.findAll({
      where: whereClause,
      include: [
        { model: ToolBoxTackleAction, as: "action_items" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
      order: [["date", "DESC"]],
    });

    return res.status(200).json({
      message: "Tool Box Tackles fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all tool box tackles (for admin/org)
const getAll = async (req, res) => {
  try {
    const VendorCode = getVendorCode(req);
    const whereClause = VendorCode ? { VendorCode } : {};
    const records = await ToolBoxTackle.findAll({
      where: whereClause,
      include: [
        { model: ToolBoxTackleAction, as: "action_items" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
      order: [["date", "DESC"]],
    });

    return res.status(200).json({
      message: "All Tool Box Tackles fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get a single tool box tackle by ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    const record = await ToolBoxTackle.findByPk(id, {
      include: [
        { model: ToolBoxTackleAction, as: "action_items" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
    });

    if (!record) {
      return res.status(404).json({ message: "Tool Box Tackle not found" });
    }

    // Employees can only view their own records, admins can view all
    const isAdmin = ["admin", "administrator", "organization"].includes((userRole || "").toLowerCase());
    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({
      message: "Tool Box Tackle fetched successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update a tool box tackle
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    const record = await ToolBoxTackle.findByPk(id);

    if (!record) {
      return res.status(404).json({ message: "Tool Box Tackle not found" });
    }

    // Employees can only update their own records, admins can update all
    const isAdmin = ["admin", "administrator", "organization"].includes((userRole || "").toLowerCase());
    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      date,
      section,
      department,
      company_supervisor,
      safety_representative,
      contractor_representative,
      contract_employees,
      point_discussed,
      general_safety_items,
      safety_interest_items,
      standard_operating_procedures,
      employee_reminders,
      safety_message_handouts,
      action_items,
      employees,
      employes,
    } = req.body;

    // Upload group photo to S3 first (do not save record if upload fails)
    let employee_group_photo;
    if (req.file) {
      const uploadResult = await uploadToS3(req.file, FOLDER);
      if (!uploadResult.status) {
        return res.status(400).json({
          message: "Image upload failed",
          error: "employee_group_photo upload failed",
        });
      }
      employee_group_photo = uploadResult.url;
    }

    const parsedEmployees = Array.isArray(employees)
      ? employees
      : Array.isArray(employes)
        ? employes
        : parseJsonArray(employees, parseJsonArray(employes, record.employees));

    const parsedActionItems = parseJsonArray(action_items, []);

    // Update tool box tackle fields
    await record.update({
      date: date || record.date,
      section: section || record.section,
      department: department || record.department,
      company_supervisor: company_supervisor || record.company_supervisor,
      safety_representative:
        safety_representative !== undefined
          ? safety_representative
          : record.safety_representative,
      contractor_representative:
        contractor_representative !== undefined
          ? contractor_representative
          : record.contractor_representative,
      contract_employees:
        contract_employees !== undefined
          ? contract_employees
          : record.contract_employees,
      point_discussed:
        point_discussed !== undefined
          ? point_discussed
          : record.point_discussed,
      general_safety_items:
        general_safety_items !== undefined
          ? general_safety_items
          : record.general_safety_items,
      safety_interest_items:
        safety_interest_items !== undefined
          ? safety_interest_items
          : record.safety_interest_items,
      standard_operating_procedures:
        standard_operating_procedures !== undefined
          ? standard_operating_procedures
          : record.standard_operating_procedures,
      employee_reminders:
        employee_reminders !== undefined
          ? employee_reminders
          : record.employee_reminders,
      safety_message_handouts:
        safety_message_handouts !== undefined
          ? safety_message_handouts
          : record.safety_message_handouts,
      employees: parsedEmployees,
      ...(employee_group_photo !== undefined ? { employee_group_photo } : {}),
    });

    // Update action items if provided (replace all existing)
    if (parsedActionItems && parsedActionItems.length > 0) {
      // Delete existing action items
      await ToolBoxTackleAction.destroy({ where: { tool_box_tackle_id: id } });

      // Create new action items
      const actionRecords = parsedActionItems.map((action) => ({
        item: action.item,
        action_by: action.action_by,
        when: action.when,
        tool_box_tackle_id: id,
      }));

      await ToolBoxTackleAction.bulkCreate(actionRecords);
    }

    // Fetch updated record
    const result = await ToolBoxTackle.findByPk(id, {
      include: [
        { model: ToolBoxTackleAction, as: "action_items" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
    });

    return res.status(200).json({
      message: "Tool Box Tackle updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete a tool box tackle
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    const record = await ToolBoxTackle.findByPk(id);

    if (!record) {
      return res.status(404).json({ message: "Tool Box Tackle not found" });
    }

    // Employees can only delete their own records, admins can delete all
    const isAdmin = ["admin", "administrator", "organization"].includes((userRole || "").toLowerCase());
    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete associated action items first
    await ToolBoxTackleAction.destroy({ where: { tool_box_tackle_id: id } });

    // Delete the tool box tackle
    await record.destroy();

    return res.status(200).json({
      message: "Tool Box Tackle deleted successfully",
    });
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
