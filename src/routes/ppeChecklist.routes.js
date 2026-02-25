import express from "express";
import ppeChecklistController from "../controllers/ppeChecklist.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { ppeChecklistItemImageFields } from "../middlewares/multer.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Employee routes - employees can create and manage their own records
router.post(
  "/",
  authorize("employee", "admin"),
  ppeChecklistItemImageFields,
  ppeChecklistController.create,
);
router.get(
  "/my-records",
  authorize("employee", "admin"),
  ppeChecklistController.getMyRecords,
);

// Admin only - get all records from all employees
router.get("/all", authorize("admin"), ppeChecklistController.getAll);

// Both employee and admin can access (with ownership check in controller)
router.get(
  "/:id",
  authorize("employee", "admin"),
  ppeChecklistController.getById,
);
router.put(
  "/:id",
  authorize("employee", "admin"),
  ppeChecklistItemImageFields,
  ppeChecklistController.update,
);
// PATCH: update only status and/or after_imgs (form-data)
router.patch(
  "/:id",
  authorize("employee", "admin"),
  ppeChecklistItemImageFields,
  ppeChecklistController.partialUpdate,
);
router.delete(
  "/:id",
  authorize("employee", "admin"),
  ppeChecklistController.remove,
);

export default router;
