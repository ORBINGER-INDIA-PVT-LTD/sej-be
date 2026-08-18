import express from "express";
import locationController from "../controllers/location.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// Require auth
router.use(authenticate);

// Create location
router.post("/", authorize("employee", "admin"), locationController.create);

// Get all locations
router.get("/all", authorize("employee", "admin"), locationController.getAll);

// Get single location
router.get("/:id", authorize("employee", "admin"), locationController.getById);

// Update single location
router.put("/:id", authorize("employee", "admin"), locationController.update);

export default router;