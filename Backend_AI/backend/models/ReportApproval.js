const mongoose = require("mongoose")

const ReportApprovalSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      default: null,
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    approvedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

ReportApprovalSchema.index({ reportId: 1, collegeId: 1 }, { unique: true })

module.exports = mongoose.model("ReportApproval", ReportApprovalSchema)
