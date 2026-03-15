const logAudit = require("../utils/auditLogger");
const { ROLE_GROUPS } = require("../constants/roles")
const { logger } = require("../utils/logger")

const ugOnlyMiddleware = (req, res, next) => {
  try {
    // 1. Platform Admin roles bypass
    if (req.user && ROLE_GROUPS.UG_BYPASS.includes(req.user.role)) {
      return next();
    }

    // 2. Check departmentType for others
    if (req.user && req.user.departmentType === "UG") {
      return next();
    }

    // 3. Block and Log
    if (req.user) {
      logAudit(
        req.user,
        "ACCESS_RESTRICTED_DEPARTMENT",
        "access",
        null,
        req
      );
    }
    logger.warn("ug_only_blocked", {
      requestId: req.requestId || null,
      role: req.user?.role || null,
      userId: req.user?._id?.toString?.() || null,
      path: req.originalUrl || req.url,
    })

    return res.status(403).json({
      message: "Access restricted. Please contact the Platform Admin."
    });
  } catch (error) {
    next(error);
  }
};

module.exports = ugOnlyMiddleware;
