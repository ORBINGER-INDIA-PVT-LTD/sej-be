import db from "../models/index.js";
import { Op } from "sequelize";
const Role = db.Role;
const User = db.User;
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { normalizeLoginPayload } from "../utils/authPayload.js";
import {
  isAdminCreationAllowed,
  normalizeRegistrationPayload,
} from "../utils/adminRegistration.js";

const register = async (req, res) => {
  try {
    const { emp_id, emp_name, email, password, location, roleName } =
      normalizeRegistrationPayload(req.body);

    if (!emp_id || !emp_name || !email || !password) {
      return res.status(400).json({
        message: "emp_id, emp_name, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const targetRole = await Role.findOne({
      where: { role_name: roleName },
    });

    if (!targetRole) {
      return res.status(404).json({ message: `${roleName} role not found` });
    }

    const existingAdmin = await User.findOne({
      include: [{ model: Role }],
      where: {
        '$role.role_name$': 'admin',
      },
    });

    // const canCreateAdmin = isAdminCreationAllowed(existingAdmin, roleName);
    // if (roleName === "admin" && !canCreateAdmin) {
    //   return res.status(403).json({
    //     message: "Admin already exists. Please use an existing admin account.",
    //   });
    // }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      emp_id,
      emp_name,
      email,
      password: hashedPassword,
      location,
      role_id: targetRole.id,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = normalizeLoginPayload(req.body);

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Email/Emp ID and password are required" });
    }

    // Find user by email OR emp_id
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { emp_id: identifier }],
      },
      include: [{ model: Role }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = normalizeLoginPayload(req.body);

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Email/Emp ID and password are required" });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { emp_id: identifier }],
      },
      include: [{ model: Role }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const adminRole = user.role?.role_name?.toLowerCase();
    if (adminRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Admin login successful",
      token,
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, attributes: ["id", "role_name"] }],
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default {
  register,
  login,
  adminLogin,
  getAllUsers,
};
