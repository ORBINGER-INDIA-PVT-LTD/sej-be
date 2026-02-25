import db from "../models/index.js";
import { Op } from "sequelize";
const Role = db.Role;
const User = db.User;
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const register = async (req, res) => {
  try {
    const { emp_id, emp_name, email, password, location } = req.body;

    // check duplicate emp_id or email
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Always assign employee role for registration
    const employeeRole = await Role.findOne({
      where: { role_name: "employee" },
    });

    if (!employeeRole) {
      return res
        .status(500)
        .json({ message: "Employee role not found. Please contact admin." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      emp_id,
      emp_name,
      email,
      password: hashedPassword,
      location,
      role_id: employeeRole.id,
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
    const { identifier, password } = req.body;

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
  getAllUsers,
};
