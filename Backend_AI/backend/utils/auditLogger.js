const AuditLog = require("../models/AuditLog");
const { logger } = require("./logger")

const getIpAddress = (req) => {
  if (!req) return "";
  const forwarded = req.headers && req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (req.ip) return req.ip;
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }
  return "";
};

const getUserAgent = (req) => {
  if (!req || !req.headers) return "";
  return req.headers["user-agent"] || "";
};

const logAudit = async (user, action, entityType, entityId, req, metadata = null) => {
  try {
    const userId = user && user._id ? user._id : null;
    const role = user && user.role ? user.role : null;
    const userModel =
      user && user.constructor && user.constructor.modelName
        ? user.constructor.modelName
        : null;

    await AuditLog.create({
      userId,
      userModel,
      role,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });
  } catch (err) {
    logger.warn("audit_log_write_failed", { message: err.message, action, entityType, code: "AUDIT_LOG_ERROR" })
  }
};

module.exports = logAudit;
