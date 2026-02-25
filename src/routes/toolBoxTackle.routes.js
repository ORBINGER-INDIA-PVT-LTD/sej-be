import express from "express";
import toolBoxTackleController from "../controllers/toolBoxTackle.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { uploadToolBoxTackleGroupPhoto } from "../middlewares/multer.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Employee routes - employees can create and manage their own records
router.post(
  "/",
  authorize("employee", "admin"),
  uploadToolBoxTackleGroupPhoto,
  toolBoxTackleController.create
);
router.get("/my-records", authorize("employee", "admin"), toolBoxTackleController.getMyRecords);

// Admin only - get all records from all employees
router.get("/all", authorize("admin"), toolBoxTackleController.getAll);

// Both employee and admin can access (with ownership check in controller)
router.get("/:id", authorize("employee", "admin"), toolBoxTackleController.getById);
router.put(
  "/:id",
  authorize("employee", "admin"),
  uploadToolBoxTackleGroupPhoto,
  toolBoxTackleController.update
);
router.delete("/:id", authorize("employee", "admin"), toolBoxTackleController.remove);

export default router;

