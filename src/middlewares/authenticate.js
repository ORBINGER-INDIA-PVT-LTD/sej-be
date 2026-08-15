import jwt from "jsonwebtoken";
import db from "../models/index.js";

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, org_id, VendorCode }

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

    // Resolve VendorCode — from token, fallback to query/body param
    if (!req.user.VendorCode) {
      req.user.VendorCode = req.query.VendorCode || req.body.VendorCode || null;
    }

    // If still no VendorCode and this is an employee, fetch from DB
    if (!req.user.VendorCode && req.user.id && req.user.roleName !== "organization") {
      const userRecord = await db.User.findByPk(req.user.id, { attributes: ["VendorCode", "org_id"] });
      req.user.VendorCode = userRecord?.VendorCode || null;
      req.user.org_id = userRecord?.org_id || req.user.org_id || 1;
    }

    // Ensure req.user.org_id is set (for backward compat)
    if (!req.user.org_id) {
      req.user.org_id = 1;
    }

    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
