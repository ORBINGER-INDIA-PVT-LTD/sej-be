import db from "../models/index.js";

export const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // req.user.role contains role_id from JWT
      const role = await db.Role.findByPk(req.user.role);

      if (!role || !allowedRoles.includes(role.role_name)) {
        return res.status(403).json({ message: "Access denied" });
      }

      req.user.roleName = role.role_name; // Attach role name for convenience
      next();
    } catch (error) {
      return res.status(500).json({ message: "Authorization error" });
    }
  };
};
