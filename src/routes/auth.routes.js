import express from "express";
import authController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// Public route - anyone can login
router.post("/login", authController.login);

// Protected route - only authenticated admin can register new users
router.post(
  "/register",
  authenticate,
  authorize("admin"),
  authController.register
);

// Admin only - get all users
router.get(
  "/users",
  authenticate,
  authorize("admin"),
  authController.getAllUsers
);

export default router;
