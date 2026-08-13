import express from "express";
import ppeInspectionController from "../controllers/ppeInspection.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// Require auth
router.use(authenticate);

// Create record
router.post("/", authorize("employee", "admin"), ppeInspectionController.create);

// Get my records
router.get("/my-records", authorize("employee", "admin"), ppeInspectionController.getMyRecords);

// Get all records (Admin & Employee)
router.get("/all", authorize("employee", "admin"), ppeInspectionController.getAll);

// Get by employee ID (empId)
router.get("/employee/:empId", authorize("employee", "admin"), ppeInspectionController.getByEmpId);

// Update single item after-report
router.put("/item/:itemId/after-report", authorize("employee", "admin"), ppeInspectionController.updateItemAfterReport);

// Get single record
router.get("/:id", authorize("employee", "admin"), ppeInspectionController.getById);

// Update single record
router.put("/:id", authorize("employee", "admin"), ppeInspectionController.update);

// Delete single record
router.delete("/:id", authorize("employee", "admin"), ppeInspectionController.remove);

export default router;
