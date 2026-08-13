import express from "express";
import toolsAndTacklesController from "../controllers/toolsAndTackles.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// Require auth
router.use(authenticate);

// Create checklist
router.post("/", authorize("employee", "admin"), toolsAndTacklesController.create);

// Get my checklists
router.get("/my-records", authorize("employee", "admin"), toolsAndTacklesController.getMyRecords);

// Admin & Employee - get all records (templates)
router.get("/all", authorize("employee", "admin"), toolsAndTacklesController.getAll);

// Get single record
router.get("/:id", authorize("employee", "admin"), toolsAndTacklesController.getById);

// Update single record
router.put("/:id", authorize("employee", "admin"), toolsAndTacklesController.update);

// Delete single record
router.delete("/:id", authorize("employee", "admin"), toolsAndTacklesController.remove);

export default router;
