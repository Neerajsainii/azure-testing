const mongoose = require("mongoose")

const PlacementNotificationSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      default: null,
      index: true,
    },
    targetRoles: {
      type: [String],
      default: [],
    },
    targetUserIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    readBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  { timestamps: true }
)

PlacementNotificationSchema.index({ createdAt: -1 })
PlacementNotificationSchema.index({ collegeId: 1, createdAt: -1 })

module.exports = mongoose.model("PlacementNotification", PlacementNotificationSchema)
