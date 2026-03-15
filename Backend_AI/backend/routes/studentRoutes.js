const express = require("express");
const router = express.Router();
const {
  getStudentProfile,
  updateStudentProfile,
  applyToDrive,
  getApplications
} = require("../controllers/studentController");
const { getOpenings } = require("../controllers/placementDriveController");

const authMiddleware = require("../middleware/authMiddleware");
const ugOnlyMiddleware = require("../middleware/ugOnlyMiddleware");
const validate = require("../middleware/validationMiddleware")
const { profileUpdateSchema } = require("../validation/studentValidation")

// Get profile
router.get("/profile", authMiddleware, ugOnlyMiddleware, getStudentProfile);

// Update profile
router.put("/profile", authMiddleware, ugOnlyMiddleware, validate(profileUpdateSchema), updateStudentProfile);

// Get Openings
router.get("/openings", authMiddleware, ugOnlyMiddleware, getOpenings);

// Apply to drive
router.post("/drives/:id/apply", authMiddleware, ugOnlyMiddleware, applyToDrive);

// Get my applications
router.get("/applications", authMiddleware, ugOnlyMiddleware, getApplications);

module.exports = router;
