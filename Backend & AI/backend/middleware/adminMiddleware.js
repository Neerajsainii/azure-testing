const { ROLES } = require("../constants/roles")

const adminMiddleware = (req, res, next) => {
  const allowedRoles = [
    ROLES.PLATFORM_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.PLACEMENT_OFFICER,
    ROLES.HOD,
  ];

  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: "Admin access denied"
    });
  }

  next();
};

module.exports = adminMiddleware;
