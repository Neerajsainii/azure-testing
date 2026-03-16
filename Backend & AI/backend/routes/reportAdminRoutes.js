const express = require("express");
const router = express.Router();

const {
  adminOverviewReport
} = require("../controllers/reportController");
const { exportPrincipalReport } = require("../controllers/reportExportController")

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ugOnlyMiddleware = require("../middleware/ugOnlyMiddleware");
const { ROLE_GROUPS } = require("../constants/roles")

router.get(
  "/overview",
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware(ROLE_GROUPS.ADMIN_REPORTING),
  adminOverviewReport
);
router.get(
  "/export",
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware(ROLE_GROUPS.ADMIN_REPORTING),
  exportPrincipalReport
)

module.exports = router;
