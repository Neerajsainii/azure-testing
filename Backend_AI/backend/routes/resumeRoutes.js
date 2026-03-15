const express = require("express");
const router = express.Router();

const resumeController = require("../controllers/resumeController");
const authMiddleware = require("../middleware/authMiddleware");
const ugOnlyMiddleware = require("../middleware/ugOnlyMiddleware");
const validate = require("../middleware/validationMiddleware")
const {
  resumeSaveSchema,
  templateSelectionSchema,
  jobDescriptionSchema,
  evaluateProjectSchema,
} = require("../validation/resumeValidation")


// Create or update resume details (editing feature)
router.post("/save", authMiddleware, ugOnlyMiddleware, validate(resumeSaveSchema), resumeController.saveResume);


// Fetch resume for dashboard
router.get("/me", authMiddleware, ugOnlyMiddleware, resumeController.getMyResume);


// Select resume template
router.post("/select-template", authMiddleware, ugOnlyMiddleware, validate(templateSelectionSchema), resumeController.selectTemplate);


// Preview resume (HTML)
router.get("/preview", authMiddleware, ugOnlyMiddleware, resumeController.previewResume);


// Calculate ATS score
router.post("/ats-score", authMiddleware, ugOnlyMiddleware, resumeController.calculateATSScore);

// Get ATS score
router.get("/ats-score", authMiddleware, ugOnlyMiddleware, resumeController.getATSScore);

// AI: Extract skills from job description
router.post("/extract-skills", authMiddleware, ugOnlyMiddleware, validate(jobDescriptionSchema), resumeController.extractSkills);

// AI: Job–resume match score
router.post("/job-match", authMiddleware, ugOnlyMiddleware, validate(jobDescriptionSchema), resumeController.jobMatch);

// AI: Evaluate project vs job description
router.post("/evaluate-project", authMiddleware, ugOnlyMiddleware, validate(evaluateProjectSchema), resumeController.evaluateProject);

// Download resume as PDF
router.get("/download", authMiddleware, ugOnlyMiddleware, resumeController.downloadResume);

module.exports = router;
