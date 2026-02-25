import express from "express";
import toolsAndTacklesController from "../controllers/toolsAndTackles.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { uploadToolsAndTacklesImages } from "../middlewares/multer.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create/update use form-data (multipart) for before_imgs + after_imgs
router.post(
  "/",
  authorize("employee", "admin"),
  uploadToolsAndTacklesImages,
  toolsAndTacklesController.create
);
router.get("/my-records", authorize("employee", "admin"), toolsAndTacklesController.getMyRecords);

// Admin only - get all records from all employees
router.get("/all", authorize("admin"), toolsAndTacklesController.getAll);

// Both employee and admin can access (with ownership check in controller)
router.get("/:id", authorize("employee", "admin"), toolsAndTacklesController.getById);
router.put(
  "/:id",
  authorize("employee", "admin"),
  uploadToolsAndTacklesImages,
  toolsAndTacklesController.update
);
// PATCH: update only status and/or after_imgs (form-data)
router.patch(
  "/:id",
  authorize("employee", "admin"),
  uploadToolsAndTacklesImages,
  toolsAndTacklesController.partialUpdate
);
router.delete("/:id", authorize("employee", "admin"), toolsAndTacklesController.remove);

export default router;

