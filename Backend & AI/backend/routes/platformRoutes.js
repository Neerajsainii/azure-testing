const express = require("express");
const router = express.Router();
const logAudit = require("../utils/auditLogger");
const hierarchyController = require("../controllers/hierarchyController");
const platformAdminController = require("../controllers/platformAdminController")
const asyncHandler = require("../middleware/asyncHandler");

router.get("/", (req, res) => {
  if (req.user) {
    logAudit(req.user, "PLATFORM_ACCESS", "platform", null, req);
  }
  res.json({ message: "Platform Admin Area" });
});

// Platform Admin creates Principal
router.post("/create-principal", asyncHandler(hierarchyController.createPrincipal));
router.get("/overview", asyncHandler(platformAdminController.getPlatformOverview))
router.get("/colleges", asyncHandler(platformAdminController.listCollegeDepartmentCapacity))
router.patch("/colleges/:collegeId/department-limit", asyncHandler(platformAdminController.updateCollegeDepartmentLimit))
router.get("/invitations", asyncHandler(platformAdminController.listInvitations))

module.exports = router;
