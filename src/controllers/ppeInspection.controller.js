import db from "../models/index.js";

const PpeInspection = db.PpeInspection;
const PpeInspectionEmployee = db.PpeInspectionEmployee;
const PpeInspectionItem = db.PpeInspectionItem;
const User = db.User;

// Helper to get VendorCode from request
const getVendorCode = (req) =>
  req.user?.VendorCode || req.query.VendorCode || req.body.VendorCode || null;

// Helper to include nested associations cleanly
const getNestedIncludes = () => [
  { model: User, as: "user", attributes: ["id", "emp_name", "email", "location"] },
  {
    model: PpeInspectionEmployee,
    as: "employees",
    include: [
      { model: db.Employee, as: "employee", attributes: ["id", "emp_id", "emp_name"] },
      { model: PpeInspectionItem, as: "items" }
    ]
  }
];

// Create new PPE Inspection entry (Single permit, multiple employees, multiple items)
const create = async (req, res) => {
  try {
    const {
      permitNumber,
      date,
      typeOfWork,
      nameOfSupervisor,
      sopNumber,
      jobDescription,
      employees, // structured list: [ { employeeId, items: [...] } ]
    } = req.body;
    const user_id = req.user.id;
    const VendorCode = getVendorCode(req);

    // Create parent permit record
    const record = await PpeInspection.create({
      user_id,
      permit_number: permitNumber,
      date,
      type_of_work: typeOfWork,
      name_of_supervisor: nameOfSupervisor,
      sop_number: sopNumber,
      job_description: jobDescription,
      org_id: req.user?.org_id || 1,
      VendorCode,
    });

    let parsedEmployees = [];
    if (typeof employees === "string") {
      try { parsedEmployees = JSON.parse(employees); } catch { parsedEmployees = []; }
    } else if (Array.isArray(employees)) {
      parsedEmployees = employees;
    }

    // Process employees and their grandchild checklist items
    for (const empEntry of parsedEmployees) {
      const empInspect = await PpeInspectionEmployee.create({
        ppe_inspection_id: record.id,
        employee_id: empEntry.employeeId,
      });

      const items = empEntry.items || [];
      if (items.length > 0) {
        const rows = items.map((t) => ({
          ppe_inspection_employee_id: empInspect.id,
          ppe_item_name: t.itemName || t.ppe_item_name || "Unknown PPE Item",
          checklist_points: t.checklistPoints || t.checklist_points || [],
          other: t.other || "",
          description: t.description || "",
          status: t.status || "",
          after_report: t.afterReport || t.after_report || null,
          after_report_date: t.afterReportDate || t.after_report_date || null,
        }));
        await PpeInspectionItem.bulkCreate(rows);
      }
    }

    const createdRecord = await PpeInspection.findByPk(record.id, {
      include: getNestedIncludes(),
    });

    return res.status(201).json({
      message: "PPE Inspection record created successfully",
      data: createdRecord,
    });
  } catch (error) {
    console.error("Error creating PPE Inspection:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get current user's records
const getMyRecords = async (req, res) => {
  try {
    const user_id = req.user.id;
    const records = await PpeInspection.findAll({
      where: { user_id },
      include: getNestedIncludes(),
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "PPE Inspection records fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all records (admin / employee)
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
    const records = await PpeInspection.findAll({
      where: whereClause,
      include: getNestedIncludes(),
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "All PPE Inspection records fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get records by employee empId
const getByEmpId = async (req, res) => {
  try {
    const { empId } = req.params;
    const records = await PpeInspection.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "emp_name", "email", "location"] },
        {
          model: PpeInspectionEmployee,
          as: "employees",
          where: { employee_id: empId },
          include: [
            { model: db.Employee, as: "employee", attributes: ["id", "emp_id", "emp_name"] },
            { model: PpeInspectionItem, as: "items" }
          ]
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: `PPE Inspection records for employee ${empId} fetched successfully`,
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

    const record = await PpeInspection.findByPk(id, {
      include: getNestedIncludes(),
    });

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({
      message: "PPE Inspection record fetched successfully",
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
      employees,
    } = req.body;
    const user_id = req.user.id;
    const userRole = req.user.roleName || "";
    const isAdmin = ["admin", "administrator", "organization"].includes(userRole.toLowerCase());

    const record = await PpeInspection.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await record.update({
      permit_number: permitNumber,
      date,
      type_of_work: typeOfWork,
      name_of_supervisor: nameOfSupervisor,
      sop_number: sopNumber,
      job_description: jobDescription,
      updatedAt: new Date(),
    });

    // Delete nested records and recreate
    const empRows = await PpeInspectionEmployee.findAll({ where: { ppe_inspection_id: id } });
    const empRowIds = empRows.map(r => r.id);
    await PpeInspectionItem.destroy({ where: { ppe_inspection_employee_id: empRowIds } });
    await PpeInspectionEmployee.destroy({ where: { ppe_inspection_id: id } });

    let parsedEmployees = [];
    if (typeof employees === "string") {
      try { parsedEmployees = JSON.parse(employees); } catch { parsedEmployees = []; }
    } else if (Array.isArray(employees)) {
      parsedEmployees = employees;
    }

    for (const empEntry of parsedEmployees) {
      const empInspect = await PpeInspectionEmployee.create({
        ppe_inspection_id: id,
        employee_id: empEntry.employeeId,
      });

      const items = empEntry.items || [];
      if (items.length > 0) {
        const rows = items.map((t) => ({
          ppe_inspection_employee_id: empInspect.id,
          ppe_item_name: t.itemName || t.ppe_item_name || "Unknown PPE Item",
          checklist_points: t.checklistPoints || t.checklist_points || [],
          other: t.other || "",
          description: t.description || "",
          status: t.status || "",
          after_report: t.afterReport || t.after_report || null,
          after_report_date: t.afterReportDate || t.after_report_date || null,
        }));
        await PpeInspectionItem.bulkCreate(rows);
      }
    }

    return res.status(200).json({ message: "PPE Inspection record updated successfully" });
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

    const record = await PpeInspection.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const empRows = await PpeInspectionEmployee.findAll({ where: { ppe_inspection_id: id } });
    const empRowIds = empRows.map(r => r.id);
    await PpeInspectionItem.destroy({ where: { ppe_inspection_employee_id: empRowIds } });
    await PpeInspectionEmployee.destroy({ where: { ppe_inspection_id: id } });
    await record.destroy();

    return res.status(200).json({ message: "PPE Inspection record deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update a single item's after_report
const updateItemAfterReport = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { afterReport, afterReportDate } = req.body;

    const item = await PpeInspectionItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await item.update({
      after_report: afterReport,
      after_report_date: afterReportDate,
    });

    return res.status(200).json({ message: "After report updated successfully", data: item });
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
  updateItemAfterReport,
};
