import db from "../models/index.js";

const DailyJobPlan = db.DailyJobPlan;
const Hazard = db.Hazard;
const User = db.User;

// Helper to get VendorCode from request
const getVendorCode = (req) =>
  req.user?.VendorCode || req.query.VendorCode || req.body.VendorCode || null;

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

    const user_id = req.user.id;
    const VendorCode = getVendorCode(req);

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
      org_id: req.user?.org_id || 1,
      VendorCode,
    });

    if (hazards && hazards.length > 0) {
      const hazardRecords = hazards.map((hazard) => ({
        hazard_description: hazard.hazard_description,
        necessary_step: hazard.necessary_step,
        on_job: hazard.on_job ?? null,
        daily_job_plan_id: dailyJobPlan.id,
      }));
      await Hazard.bulkCreate(hazardRecords);
    }

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
    const VendorCode = getVendorCode(req);
    const whereClause = VendorCode ? { user_id, VendorCode } : { user_id };

    const plans = await DailyJobPlan.findAll({
      where: whereClause,
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

// Get all daily job plans (for admin/org)
const getAll = async (req, res) => {
  try {
    const VendorCode = getVendorCode(req);
    const whereClause = VendorCode ? { VendorCode } : {};

    const plans = await DailyJobPlan.findAll({
      where: whereClause,
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

    const isAdmin = ["admin", "administrator", "organization"].includes((userRole || "").toLowerCase());
    if (!isAdmin && plan.user_id !== user_id) {
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

    const isAdmin = ["admin", "administrator", "organization"].includes((userRole || "").toLowerCase());
    if (!isAdmin && plan.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      permit_no, date, type_of_work, name_of_supervisor, sop_number,
      job_description, hazards, job_not_done, employees, remployes,
    } = req.body;

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

    if (hazards && hazards.length > 0) {
      await Hazard.destroy({ where: { daily_job_plan_id: id } });
      const hazardRecords = hazards.map((hazard) => ({
        hazard_description: hazard.hazard_description,
        necessary_step: hazard.necessary_step,
        on_job: hazard.on_job ?? null,
        daily_job_plan_id: id,
      }));
      await Hazard.bulkCreate(hazardRecords);
    }

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

    const isAdmin = ["admin", "administrator", "organization"].includes((userRole || "").toLowerCase());
    if (!isAdmin && plan.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Hazard.destroy({ where: { daily_job_plan_id: id } });
    await plan.destroy();

    return res.status(200).json({ message: "Daily job plan deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default { create, getMyPlans, getAll, getById, update, remove };
