const PlacementNotification = require("../models/PlacementNotification")
const { buildCollegeScope } = require("../utils/accessScope")
const { logger } = require("../utils/logger")

function canRead(notification, user) {
  if (!notification) return false
  if (!user) return false
  if (notification.targetUserIds?.length > 0) {
    return notification.targetUserIds.some((id) => String(id) === String(user._id))
  }
  if (notification.targetRoles?.length > 0) {
    return notification.targetRoles.includes(user.role)
  }
  return true
}

exports.listNotifications = async (req, res) => {
  try {
    const collegeScope = buildCollegeScope(req.user)
    const notifications = await PlacementNotification.find(collegeScope)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
    const filtered = notifications.filter((n) => canRead(n, req.user))
    return res.json(
      filtered.map((n) => ({
        id: n._id,
        title: n.title,
        body: n.body,
        time: n.createdAt,
        read: (n.readBy || []).some((u) => String(u) === String(req.user._id)),
      }))
    )
  } catch (error) {
    logger.error("notifications_list_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(500).json({ message: "Failed to load notifications" })
  }
}

exports.createNotification = async (req, res) => {
  try {
    const payload = req.body || {}
    const item = await PlacementNotification.create({
      collegeId: req.user.collegeId || null,
      targetRoles: payload.targetRoles || [],
      targetUserIds: payload.targetUserIds || [],
      title: payload.title,
      body: payload.body,
      meta: payload.meta || {},
    })
    return res.status(201).json(item)
  } catch (error) {
    return res.status(500).json({ message: "Failed to create notification" })
  }
}

exports.markRead = async (req, res) => {
  try {
    const item = await PlacementNotification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    )
    if (!item) return res.status(404).json({ message: "Notification not found" })
    return res.json({ message: "Notification marked read" })
  } catch (error) {
    return res.status(500).json({ message: "Failed to mark notification" })
  }
}

exports.deleteNotification = async (req, res) => {
  try {
    await PlacementNotification.findByIdAndDelete(req.params.id)
    return res.json({ message: "Notification deleted" })
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete notification" })
  }
}

exports.markAllRead = async (req, res) => {
  try {
    const collegeScope = buildCollegeScope(req.user)
    const list = await PlacementNotification.find(collegeScope).select("_id").lean()
    const ids = list.map((n) => n._id)
    if (ids.length > 0) {
      await PlacementNotification.updateMany({ _id: { $in: ids } }, { $addToSet: { readBy: req.user._id } })
    }
    return res.json({ message: "All notifications marked read" })
  } catch (error) {
    return res.status(500).json({ message: "Failed to mark all read" })
  }
}
