import jwt from "jsonwebtoken";
import db from "../models/index.js";

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }

    if (req.user && req.user.role) {
      if (typeof req.user.role === "number" || !isNaN(Number(req.user.role))) {
        const roleObj = await db.Role.findByPk(req.user.role);
        req.user.roleName = roleObj ? roleObj.role_name.toLowerCase() : "employee";
      } else {
        req.user.roleName = req.user.role.toString().toLowerCase();
      }
    } else {
      req.user.roleName = "employee";
    }

    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
