import express from "express";
import toolsListController from "../controllers/toolsList.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// Require auth
router.use(authenticate);

// Create record
router.post("/", authorize("employee", "admin"), toolsListController.create);

// Get my records
router.get("/my-records", authorize("employee", "admin"), toolsListController.getMyRecords);

// Get all records (Admin & Employee)
router.get("/all", authorize("employee", "admin"), toolsListController.getAll);

// Get by employee ID (empId)
router.get("/employee/:empId", authorize("employee", "admin"), toolsListController.getByEmpId);

// Get single record
router.get("/:id", authorize("employee", "admin"), toolsListController.getById);

// Update single record
router.put("/:id", authorize("employee", "admin"), toolsListController.update);

// Delete single record
router.delete("/:id", authorize("employee", "admin"), toolsListController.remove);

export default router;
