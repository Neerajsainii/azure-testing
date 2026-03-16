const express = require("express");
const router = express.Router();

const {
  hodDepartmentReport
} = require("../controllers/reportController");
const { exportPrincipalReport } = require("../controllers/reportExportController")

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ugOnlyMiddleware = require("../middleware/ugOnlyMiddleware");
const { ROLES } = require("../constants/roles")

router.get(
  "/department",
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware([ROLES.HOD]),
  hodDepartmentReport
);
router.get(
  "/export",
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware([ROLES.HOD]),
  exportPrincipalReport
)

module.exports = router;
