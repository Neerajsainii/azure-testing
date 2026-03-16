const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const ugOnlyMiddleware = require("../middleware/ugOnlyMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { ROLES } = require("../constants/roles");
const dashboard = require("../controllers/dashboardController");

// HOD profile and approvals (non-dashboard operations)
router.get(
  "/profile",
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware([ROLES.HOD]),
  dashboard.getHodProfile
);
router.put(
  "/profile",
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware([ROLES.HOD]),
  dashboard.updateHodProfile
);

router.get(
  "/approvals",
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware([ROLES.HOD]),
  dashboard.getApprovals
);
router.put(
  "/approvals/:id",
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware([ROLES.HOD]),
  dashboard.updateApproval
);

module.exports = router;
