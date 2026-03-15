const express = require("express");
const router = express.Router();
const principalController = require("../controllers/principalController");
const hierarchyController = require("../controllers/hierarchyController");
const analyticsController = require("../controllers/analyticsController")
const reportExportController = require("../controllers/reportExportController")
const reportController = require("../controllers/reportController")
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const { principalDepartmentCreateLimiter } = require("../middleware/rateLimiter");
const { ROLES } = require("../constants/roles")

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.PRINCIPAL]));

router.get("/profile", principalController.getProfile);
router.put("/profile", principalController.updateProfile);

router.get("/departments", principalController.getDepartments);
router.post("/departments", principalDepartmentCreateLimiter, principalController.createDepartment);
router.get("/student-records", principalController.getStudentRecords);
router.get("/placement-overview", principalController.getPlacementOverview);
router.get("/granted-access", principalController.getGrantedAccess);
router.get("/resume-status", principalController.getStudentResumeStatus);
router.get("/data-graph", principalController.getPrincipalDataGraph);
router.get("/analytics/department-performance", analyticsController.getDepartmentPerformance)
router.get("/analytics/placement-overview", analyticsController.getPlacementOverview)
router.get("/analytics/batch-wise", analyticsController.getBatchWise)
router.get("/analytics/company-wise", analyticsController.getCompanyWise)
router.get("/analytics/comparison", analyticsController.getComparison)
router.get("/reports/overview", reportController.principalOverviewReport)
router.get("/reports/export", reportExportController.exportPrincipalReport)
router.post("/reports/:reportId/approve", reportExportController.approveReport)
router.get("/audit-logs", principalController.getAuditLogs);

// Principal creates Placement Officer and HOD
router.post("/create-placement", asyncHandler(hierarchyController.createPlacementOfficer));
router.post("/create-hod", asyncHandler(hierarchyController.createHod));

module.exports = router;
