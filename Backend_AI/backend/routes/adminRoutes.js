const express = require("express");
const router = express.Router();

const {
  listStudents,
  exportStudentsZip,
  listColleges,
  createCollege,
  updateCollege,
  deleteCollege,
  adminDashboard,
  listAuditLogs,
  getSettings,
  updateSettings,
  listContactQueries,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware")
const checkDownloadLimit = require("../middleware/checkDownloadLimit");
const ugOnlyMiddleware = require("../middleware/ugOnlyMiddleware");
const { ROLES, ROLE_GROUPS } = require("../constants/roles")


router.get("/dashboard", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), adminDashboard);
router.get("/audit-logs", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), listAuditLogs);
router.get("/users", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), listUsers);
router.post("/users", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), createUser);
router.put("/users/:id", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), updateUser);
router.delete("/users/:id", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), deleteUser);
router.get("/students", authMiddleware, ugOnlyMiddleware, adminMiddleware, listStudents);

router.get(
  "/students/export/zip",
  authMiddleware,
  ugOnlyMiddleware,
  adminMiddleware,
  checkDownloadLimit,
  exportStudentsZip
);

router.get("/colleges", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), listColleges)
router.post("/colleges", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), createCollege)
router.put("/colleges/:id", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), updateCollege)
router.delete("/colleges/:id", authMiddleware, ugOnlyMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), deleteCollege)

// System Settings
router.get("/settings", authMiddleware, roleMiddleware(ROLE_GROUPS.ADMIN_REPORTING), getSettings);
router.put("/settings", authMiddleware, roleMiddleware(ROLE_GROUPS.ADMIN_REPORTING), updateSettings);

// Contact Queries
router.get("/contacts", authMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), listContactQueries);

// Admin Profile
router.get("/profile", authMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), getProfile);
router.put("/profile", authMiddleware, roleMiddleware([ROLES.PLATFORM_ADMIN]), updateProfile);

module.exports = router;
