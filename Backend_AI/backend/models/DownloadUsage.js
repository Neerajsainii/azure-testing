const mongoose = require("mongoose");

const DownloadUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    month: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

DownloadUsageSchema.index({ userId: 1 });
DownloadUsageSchema.index({ month: 1 });
DownloadUsageSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("DownloadUsage", DownloadUsageSchema);

