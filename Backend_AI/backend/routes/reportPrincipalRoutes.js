const express = require("express");
const router = express.Router();

const {
  principalOverviewReport
} = require("../controllers/reportController");
const { exportPrincipalReport } = require("../controllers/reportExportController")

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ugOnlyMiddleware = require("../middleware/ugOnlyMiddleware");
const { ROLES } = require("../constants/roles")

router.get(
  "/overview",
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware([ROLES.PRINCIPAL]),
  principalOverviewReport
);
router.get(
  "/export",
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware([ROLES.PRINCIPAL]),
  exportPrincipalReport
)

module.exports = router;
