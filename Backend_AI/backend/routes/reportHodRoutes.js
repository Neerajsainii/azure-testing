const express = require("express");
const router = express.Router();

const {
  hodDepartmentReport
} = require("../controllers/reportController");

// PDF export temporarily disabled — exportPrincipalReport uses Chromium which
// is incompatible with Azure Functions (AWS Lambda binary, exceeds 100MB SWA
// zip limit). TODO: Replace reportExportController with pdfkit implementation.
// const { exportPrincipalReport } = require("../controllers/reportExportController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ugOnlyMiddleware = require("../middleware/ugOnlyMiddleware");
const { ROLES } = require("../constants/roles");

router.get(
  "/department",
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware([ROLES.HOD]),
  hodDepartmentReport
);

// TODO: Re-enable once PDF generation is replaced with pdfkit/pdf-lib.
// router.get(
//   "/export",
//   authMiddleware,
//   ugOnlyMiddleware,
//   roleMiddleware([ROLES.HOD]),
//   exportPrincipalReport
// );

module.exports = router;