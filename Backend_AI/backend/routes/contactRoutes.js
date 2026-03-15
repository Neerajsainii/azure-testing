
const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { ROLES } = require("../constants/roles");
const validate = require("../middleware/validationMiddleware")
const { createContactQuerySchema } = require("../validation/contactValidation")

// Public: Submit query
router.post("/", validate(createContactQuerySchema), contactController.createContactQuery);

// Admin: List queries
router.get("/", authMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), contactController.listContactQueries);

module.exports = router;
