import express from "express";
import ppeclController from "../controllers/ppecl.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// Require auth
router.use(authenticate);

// Create checklist
router.post("/", authorize("employee", "admin"), ppeclController.create);

// Get my checklists
router.get("/my-records", authorize("employee", "admin"), ppeclController.getMyRecords);

// Admin only - get all records
router.get("/all", authorize("admin"), ppeclController.getAll);

// Get single record
router.get("/:id", authorize("employee", "admin"), ppeclController.getById);

// Update single record
router.put("/:id", authorize("employee", "admin"), ppeclController.update);

// Delete single record
router.delete("/:id", authorize("employee", "admin"), ppeclController.remove);

export default router;
