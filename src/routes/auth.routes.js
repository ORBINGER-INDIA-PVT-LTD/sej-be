import express from "express";
import authController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// Public route - anyone can login
router.post("/login", authController.login);

// Public route - admin-only login
router.post("/admin/login", authController.adminLogin);

// Route to register users
router.post("/register", authController.register);
router.post("/user/register", authController.register);
router.post("/register-admin", authController.register);

// Admin only - get all users
router.get(
  "/users",
  authController.getAllUsers
);

// Admin / Auth - delete user
router.delete(
  "/users/:id",
  authController.deleteUser
);

export default router;
