import db from "../models/index.js";

const Employee = db.Employee;

// Create employee
const create = async (req, res) => {
  try {
    const { emp_id, emp_name } = req.body;

    if (!emp_id || !emp_name) {
      return res
        .status(400)
        .json({ message: "emp_id and emp_name are required" });
    }

    const existing = await Employee.findOne({ where: { emp_id } });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Employee with this emp_id already exists" });
    }

    const employee = await Employee.create({ emp_id, emp_name });

    return res.status(201).json({
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all employees
const getAll = async (_req, res) => {
  try {
    const employees = await Employee.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({
      message: "Employees fetched successfully",
      data: employees,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update employee by id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { emp_id, emp_name } = req.body;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (emp_id && emp_id !== employee.emp_id) {
      const existing = await Employee.findOne({ where: { emp_id } });
      if (existing) {
        return res.status(400).json({
          message: "Another employee with this emp_id already exists",
        });
      }
    }

    await employee.update({
      emp_id: emp_id || employee.emp_id,
      emp_name: emp_name || employee.emp_name,
    });

    return res.status(200).json({
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete employee by id
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await employee.destroy();

    return res.status(200).json({
      message: "Employee deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default {
  create,
  getAll,
  update,
  remove,
};

