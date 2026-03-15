const mongoose = require("mongoose")

const PlacementDriveSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    companyDescription: {
      type: String,
      required: true,
      trim: true,
    },
    academicYearLabel: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "open", "closed", "archived"],
      default: "open",
      index: true,
    },
    eligibility: {
      minCgpa: { type: Number, default: 0 },
      minPercentage10: { type: Number, default: 0 },
      minPercentage12: { type: Number, default: 0 },
      maxBacklogs: { type: Number, default: 99 },
      maxGapYears: { type: Number, default: 99 },
      requiredSkills: { type: [String], default: [] },
      allowedDepartments: { type: [String], default: [] },
      allowedYears: { type: [Number], default: [] },
      minAttendancePercent: { type: Number, default: 0 },
      minAtsScore: { type: Number, default: 0 },
      minJobMatchScore: { type: Number, default: 0 },
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

PlacementDriveSchema.index({ collegeId: 1, status: 1, createdAt: -1 })
PlacementDriveSchema.index({ collegeId: 1, academicYearLabel: 1 })

module.exports = mongoose.model("PlacementDrive", PlacementDriveSchema)
