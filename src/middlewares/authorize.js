import db from "../models/index.js";

export const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      let roleName = req.user.roleName;

      if (!roleName && req.user.role) {
        if (typeof req.user.role === "number" || !isNaN(Number(req.user.role))) {
          const role = await db.Role.findByPk(req.user.role);
          roleName = role ? role.role_name : null;
        } else {
          roleName = req.user.role.toString();
        }
      }

      const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
      const normalizedUserRole = (roleName || "").toLowerCase();

      // Treat 'administrator' and 'organization' as equivalent to 'admin'
      const isAdminRole = ["admin", "administrator", "organization"].includes(normalizedUserRole);
      // Treat 'incharge', 'supervisor' and 'safety supervisor' as equivalent to 'employee'
      const isEmployeeRole = ["employee", "incharge", "supervisor", "safety supervisor"].includes(normalizedUserRole);
      
      const isAllowed =
        normalizedAllowed.includes(normalizedUserRole) ||
        (isAdminRole && normalizedAllowed.includes("admin")) ||
        (isEmployeeRole && normalizedAllowed.includes("employee"));

      if (!roleName || !isAllowed) {
        return res.status(403).json({ message: "Access denied" });
      }

      req.user.roleName = normalizedUserRole;
      next();
    } catch (error) {
      return res.status(500).json({ message: "Authorization error" });
    }
  };
};
