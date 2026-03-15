const express = require("express")
const router = express.Router()

const authMiddleware = require("../middleware/authMiddleware")
const notificationController = require("../controllers/notificationController")
const roleMiddleware = require("../middleware/roleMiddleware")
const { ROLE_GROUPS } = require("../constants/roles")

router.use(authMiddleware)

router.get("/", notificationController.listNotifications)
router.put("/read-all", notificationController.markAllRead)
router.put("/:id/read", notificationController.markRead)
router.delete("/:id", notificationController.deleteNotification)

router.post(
  "/",
  roleMiddleware([].concat(ROLE_GROUPS.STAFF_ACCESS, ROLE_GROUPS.COMPANY_MANAGEMENT)),
  notificationController.createNotification
)

module.exports = router
