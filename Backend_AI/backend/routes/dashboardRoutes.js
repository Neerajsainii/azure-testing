const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const ugOnlyMiddleware = require("../middleware/ugOnlyMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const dashboard = require("../controllers/dashboardController");
const { ROLES } = require("../constants/roles")

/* ROLE BASED DASHBOARDS */
router.get("/student", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.STUDENT]), dashboard.studentDashboard);
router.get("/hod", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.HOD]), dashboard.hodDashboard);
router.get("/hod/students", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.HOD]), dashboard.getHodStudents);
router.get("/hod/placement-stats", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.HOD]), dashboard.getHodPlacementStats);
router.get("/hod/approvals", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.HOD]), dashboard.getApprovals);
router.put("/hod/approvals/:id", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.HOD]), dashboard.updateApproval);
router.get("/hod/profile", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.HOD]), dashboard.getHodProfile);
router.put("/hod/profile", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.HOD]), dashboard.updateHodProfile);
router.get(
  "/placement",
  authMiddleware,
  ugOnlyMiddleware,
  roleMiddleware([ROLES.PLACEMENT_OFFICER]),
  dashboard.placementDashboard
);
router.get("/principal", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PRINCIPAL]), dashboard.principalDashboard);


module.exports = router;
