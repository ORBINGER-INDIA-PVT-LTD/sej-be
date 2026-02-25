import express from "express";
import dailyJobPlanController from "../controllers/dailyJobPlan.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Employee routes - employees can create and manage their own plans
router.post("/", authorize("employee", "admin"), dailyJobPlanController.create);
router.get("/my-plans", authorize("employee", "admin"), dailyJobPlanController.getMyPlans);

// Admin only - get all plans from all employees
router.get("/all", authorize("admin"), dailyJobPlanController.getAll);

// Both employee and admin can access (with ownership check in controller)
router.get("/:id", authorize("employee", "admin"), dailyJobPlanController.getById);
router.put("/:id", authorize("employee", "admin"), dailyJobPlanController.update);
router.delete("/:id", authorize("employee", "admin"), dailyJobPlanController.remove);

export default router;

