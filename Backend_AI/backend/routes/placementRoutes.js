const express = require("express")
const router = express.Router()

const authMiddleware = require("../middleware/authMiddleware")
const ugOnlyMiddleware = require("../middleware/ugOnlyMiddleware")
const roleMiddleware = require("../middleware/roleMiddleware")
const placementDriveController = require("../controllers/placementDriveController")
const notificationController = require("../controllers/notificationController")
const principalController = require("../controllers/principalController")
const dashboardController = require("../controllers/dashboardController")
const { ROLE_GROUPS, ROLES } = require("../constants/roles")

// Profile routes — must be before router.use() to avoid COMPANY_MANAGEMENT role block
router.get("/profile", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PLACEMENT_OFFICER]), dashboardController.getPlacementProfile)
router.put("/profile", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PLACEMENT_OFFICER]), dashboardController.updatePlacementProfile)

router.use(authMiddleware, ugOnlyMiddleware, roleMiddleware(ROLE_GROUPS.COMPANY_MANAGEMENT))

// Placement drive lifecycle.
router.post("/drives", placementDriveController.createPlacementDrive)
router.get("/drives", placementDriveController.listPlacementDrives)
router.get("/drives/:id", placementDriveController.getPlacementDrive)
router.put("/drives/:id", placementDriveController.updatePlacementDrive)
router.patch("/drives/:id/status", placementDriveController.updatePlacementDriveStatus)
router.delete("/drives/:id", roleMiddleware([ROLES.PLACEMENT_OFFICER, ROLES.PRINCIPAL, ROLES.PLATFORM_ADMIN]), placementDriveController.deletePlacementDrive)

// Eligibility and shortlist flow.
router.post("/drives/:id/eligibility/recompute", placementDriveController.recomputeDriveEligibility)
router.get("/drives/:id/candidates", placementDriveController.getDriveCandidates)
router.patch("/drives/:id/candidates/:studentId/round-status", placementDriveController.updateDriveCandidateRoundStatus)
router.patch("/drives/:id/candidates/:studentId/final-status", placementDriveController.updateDriveCandidateFinalStatus)
router.patch("/drives/:id/candidates/:studentId/offer", placementDriveController.updateDriveCandidateOffer)

// Placement analytics for placement dashboard.
router.get("/stats", placementDriveController.getPlacementStats)
router.post("/match-candidates", placementDriveController.matchJobCandidates)
router.get("/departments", principalController.getDepartments)
router.post("/notifications", notificationController.createNotification)

// Backward-compatible aliases used by existing frontend "Openings" page.
router.get("/openings", placementDriveController.listPlacementDrives)
router.post("/openings", placementDriveController.createPlacementDrive)

module.exports = router