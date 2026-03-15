
const mongoose = require("mongoose");

const SystemSettingsSchema = new mongoose.Schema(
  {
    sessionTimeoutMinutes: { type: Number, default: 30 },
    mfaEnabled: { type: Boolean, default: false },
    maintenanceMode: { type: Boolean, default: false },
    auditLoggingEnabled: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemSettings", SystemSettingsSchema);
