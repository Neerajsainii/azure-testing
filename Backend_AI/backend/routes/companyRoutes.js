const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const shortlistController = require("../controllers/shortlistController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ugOnlyMiddleware = require("../middleware/ugOnlyMiddleware");
const validate = require("../middleware/validationMiddleware")
const companyValidation = require("../validation/companyValidation");
const { ROLE_GROUPS, ROLES } = require("../constants/roles")

// Global Middleware for Company Routes
// 1. Authenticated
// 2. UG Only check (Platform Admins bypass)
// 3. Role check (Allowed: placement officer, principal, platform admin)
router.use(
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware(ROLE_GROUPS.COMPANY_MANAGEMENT)
);

/* ==========================
   COMPANY MANAGEMENT
   ========================== */

// Create Company
router.post("/", validate(companyValidation.createCompany), companyController.createCompany);

// List Companies
router.get("/", companyController.listCompanies);

// Get Company Details
router.get("/:id", companyController.getCompany);

// Delete Company (Restricted to platform admin)
router.delete(
  "/:id",
  roleMiddleware([ROLES.PLATFORM_ADMIN]),
  companyController.deleteCompany
);


/* ==========================
   SHORTLISTING
   ========================== */

// Run Auto-Shortlist (support both POST .../shortlist and .../shortlist/run for frontend compatibility)
router.post(
  "/:id/shortlist",
  validate(companyValidation.runShortlist),
  shortlistController.runShortlist
);
router.post(
  "/:id/shortlist/run",
  validate(companyValidation.runShortlist),
  shortlistController.runShortlist
);

// Get Shortlist Results
router.get("/:id/shortlist", shortlistController.getShortlist);

module.exports = router;
