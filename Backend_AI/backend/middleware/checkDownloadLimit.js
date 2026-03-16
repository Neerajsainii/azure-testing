const DownloadUsage = require("../models/DownloadUsage");
const logAudit = require("../utils/auditLogger");
const { ROLES } = require("../constants/roles")

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const checkDownloadLimit = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== ROLES.PLACEMENT_OFFICER) {
      return next();
    }

    const month = getCurrentMonth();
    req.downloadMonth = month;

    const usage = await DownloadUsage.findOne({
      userId: req.user._id,
      month
    });

    if (usage && usage.count >= 3) {
      logAudit(req.user, "EXPORT_LIMIT_EXCEEDED", "export", null, req);
      return res.status(429).json({
        message: "Monthly download limit exceeded"
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkDownloadLimit;
