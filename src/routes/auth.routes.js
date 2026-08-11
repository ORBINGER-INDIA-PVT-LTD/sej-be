import express from "express";
import authController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// Public route - anyone can login
router.post("/login", authController.login);

// Public route - admin-only login
router.post("/admin/login", authController.adminLogin);

// Bootstrap route to create the first admin user when no admin exists yet
router.post("/register", authController.register);

// Route to register users without requiring a prior login token
router.post("/register-admin", authController.register);

// Admin only - get all users
router.get(
  "/users",
  authenticate,
  authorize("admin"),
  authController.getAllUsers
);

export default router;
