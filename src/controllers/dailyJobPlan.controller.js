import db from "../models/index.js";

const DailyJobPlan = db.DailyJobPlan;
const Hazard = db.Hazard;
const User = db.User;

// Create a new daily job plan with hazards
const create = async (req, res) => {
  try {
    const {
      permit_no,
      date,
      type_of_work,
      name_of_supervisor,
      sop_number,
      job_description,
      hazards,
      job_not_done,
      employees,
      remployes,
    } = req.body;

    // Get user_id from authenticated user (JWT)
    const user_id = req.user.id;

    // Create the daily job plan
    const dailyJobPlan = await DailyJobPlan.create({
      permit_no,
      date: date || new Date(),
      type_of_work,
      name_of_supervisor,
      sop_number,
      job_description,
      job_not_done: Array.isArray(job_not_done) ? job_not_done : [],
      employees: Array.isArray(employees)
        ? employees
        : Array.isArray(remployes)
          ? remployes
          : [],
      user_id,
    });

    // Create hazards if provided
    if (hazards && hazards.length > 0) {
      const hazardRecords = hazards.map((hazard) => ({
        hazard_description: hazard.hazard_description,
        necessary_step: hazard.necessary_step,
        on_job: hazard.on_job ?? null,
        daily_job_plan_id: dailyJobPlan.id,
      }));

      await Hazard.bulkCreate(hazardRecords);
    }

    // Fetch the complete record with hazards
    const result = await DailyJobPlan.findByPk(dailyJobPlan.id, {
      include: [
        { model: Hazard, as: "hazards" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
    });

    return res.status(201).json({
      message: "Daily job plan created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all daily job plans for the logged-in employee
const getMyPlans = async (req, res) => {
  try {
    const user_id = req.user.id;

    const plans = await DailyJobPlan.findAll({
      where: { user_id },
      include: [
        { model: Hazard, as: "hazards" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
      order: [["date", "DESC"]],
    });

    return res.status(200).json({
      message: "Daily job plans fetched successfully",
      data: plans,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all daily job plans (for admin)
const getAll = async (req, res) => {
  try {
    const plans = await DailyJobPlan.findAll({
      include: [
        { model: Hazard, as: "hazards" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
      order: [["date", "DESC"]],
    });

    return res.status(200).json({
      message: "All daily job plans fetched successfully",
      data: plans,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get a single daily job plan by ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    const plan = await DailyJobPlan.findByPk(id, {
      include: [
        { model: Hazard, as: "hazards" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
    });

    if (!plan) {
      return res.status(404).json({ message: "Daily job plan not found" });
    }

    // Employees can only view their own plans, admins can view all
    if (userRole !== "admin" && plan.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({
      message: "Daily job plan fetched successfully",
      data: plan,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update a daily job plan
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    const plan = await DailyJobPlan.findByPk(id);

    if (!plan) {
      return res.status(404).json({ message: "Daily job plan not found" });
    }

    // Employees can only update their own plans, admins can update all
    if (userRole !== "admin" && plan.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      permit_no,
      date,
      type_of_work,
      name_of_supervisor,
      sop_number,
      job_description,
      hazards,
      job_not_done,
      employees,
      remployes,
    } = req.body;

    // Update daily job plan fields
    await plan.update({
      permit_no: permit_no || plan.permit_no,
      date: date || plan.date,
      type_of_work: type_of_work || plan.type_of_work,
      name_of_supervisor: name_of_supervisor || plan.name_of_supervisor,
      sop_number: sop_number || plan.sop_number,
      job_description: job_description || plan.job_description,
      job_not_done: Array.isArray(job_not_done) ? job_not_done : plan.job_not_done,
      employees: Array.isArray(employees)
        ? employees
        : Array.isArray(remployes)
          ? remployes
          : plan.employees,
    });

    // Update hazards if provided (replace all existing hazards)
    if (hazards && hazards.length > 0) {
      // Delete existing hazards
      await Hazard.destroy({ where: { daily_job_plan_id: id } });

      // Create new hazards
      const hazardRecords = hazards.map((hazard) => ({
        hazard_description: hazard.hazard_description,
        necessary_step: hazard.necessary_step,
        on_job: hazard.on_job ?? null,
        daily_job_plan_id: id,
      }));

      await Hazard.bulkCreate(hazardRecords);
    }

    // Fetch updated record
    const result = await DailyJobPlan.findByPk(id, {
      include: [
        { model: Hazard, as: "hazards" },
        { model: User, as: "employee", attributes: ["id", "emp_id", "emp_name", "email"] },
      ],
    });

    return res.status(200).json({
      message: "Daily job plan updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete a daily job plan
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    const plan = await DailyJobPlan.findByPk(id);

    if (!plan) {
      return res.status(404).json({ message: "Daily job plan not found" });
    }

    // Employees can only delete their own plans, admins can delete all
    if (userRole !== "admin" && plan.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete associated hazards first
    await Hazard.destroy({ where: { daily_job_plan_id: id } });

    // Delete the daily job plan
    await plan.destroy();

    return res.status(200).json({
      message: "Daily job plan deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default {
  create,
  getMyPlans,
  getAll,
  getById,
  update,
  remove,
};

