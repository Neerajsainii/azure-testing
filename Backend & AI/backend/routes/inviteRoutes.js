const express = require("express");
const router = express.Router();
const inviteController = require("../controllers/inviteController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { inviteLimiter } = require("../middleware/rateLimiter");
const validate = require("../middleware/validationMiddleware")
const { inviteStudentSchema, bulkImportSchema, listInvitesQuerySchema } = require("../validation/inviteValidation")
const { ROLES } = require("../constants/roles")

/**
 * @route   POST /api/hod/invite-student
 * @desc    HOD invites a student to the platform
 * @access  Private (HOD only)
 */
router.post(
  "/invite-student",
  authMiddleware,
  roleMiddleware([ROLES.HOD]),
  inviteLimiter,
  validate(inviteStudentSchema),
  inviteController.inviteStudent
);
router.post(
  "/import-students",
  authMiddleware,
  roleMiddleware([ROLES.HOD]),
  inviteLimiter,
  validate(bulkImportSchema),
  inviteController.bulkImportStudents
)
router.get(
  "/invites",
  authMiddleware,
  roleMiddleware([ROLES.HOD]),
  validate({ query: listInvitesQuerySchema }),
  inviteController.listInvites
)
router.patch(
  "/invites/:id/revoke",
  authMiddleware,
  roleMiddleware([ROLES.HOD]),
  inviteController.revokeInvite
)
router.post(
  "/invites/:id/resend",
  authMiddleware,
  roleMiddleware([ROLES.HOD]),
  inviteLimiter,
  inviteController.resendInvite
)

module.exports = router;
