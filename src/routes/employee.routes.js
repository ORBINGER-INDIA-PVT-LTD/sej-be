import express from "express";
import employeeController from "../controllers/employee.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// All employee management APIs are admin-only
router.use(authenticate);

router.post("/", authorize("admin"), employeeController.create);
router.get("/", authorize("employee", "admin"), employeeController.getAll);
router.put("/:id", authorize("admin"), employeeController.update);
router.delete("/:id", authorize("admin"), employeeController.remove);

export default router;
