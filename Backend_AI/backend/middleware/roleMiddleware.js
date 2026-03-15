const { logger } = require("../utils/logger")

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      logger.warn("rbac_denied", {
        requestId: req.requestId || null,
        role: req.user?.role || null,
        allowedRoles,
        path: req.originalUrl || req.url,
        method: req.method,
      })
      return res.status(403).json({
        success: false,
        code: "RBAC_ACCESS_DENIED",
        message: "Access denied"
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
