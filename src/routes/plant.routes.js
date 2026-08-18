import express from "express";
import plantController from "../controllers/plant.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// Require auth
router.use(authenticate);

// Create plant
router.post("/", authorize("employee", "admin"), plantController.create);

// Get all plants
router.get("/all", authorize("employee", "admin"), plantController.getAll);

// Get single plant
router.get("/:id", authorize("employee", "admin"), plantController.getById);

// Update single plant
router.put("/:id", authorize("employee", "admin"), plantController.update);

export default router;