// middleware/role.middleware.js
module.exports = (...allowedRoles) => {
  const allowed = allowedRoles.map((r) => String(r).toUpperCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRole = String(req.user.role || "").toUpperCase();

    if (!allowed.includes(userRole)) {
      console.warn(
        `[roleMiddleware] 403 — user role "${userRole}" not in [${allowed.join(", ")}]`
      );
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};