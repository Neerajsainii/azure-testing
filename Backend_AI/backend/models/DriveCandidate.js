const mongoose = require("mongoose")

const roundStatusEnum = ["pending", "qualified", "rejected", "absent"]
const finalStatusEnum = ["shortlisted", "rejected", "offered", "joined", "declined"]

const DriveCandidateSchema = new mongoose.Schema(
  {
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlacementDrive",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true,
    },
    department: {
      type: String,
      default: "",
      trim: true,
    },
    eligibilityReason: {
      type: String,
      default: "",
      trim: true,
    },
    roundStatus: {
      aptitude: { type: String, enum: roundStatusEnum, default: "pending" },
      gd: { type: String, enum: roundStatusEnum, default: "pending" },
      interview: { type: String, enum: roundStatusEnum, default: "pending" },
    },
    finalStatus: {
      type: String,
      enum: finalStatusEnum,
      default: "shortlisted",
      index: true,
    },
    packageOffered: {
      type: Number,
      default: null,
    },
    offerDate: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
)

DriveCandidateSchema.index({ driveId: 1, studentId: 1 }, { unique: true })
DriveCandidateSchema.index({ driveId: 1, finalStatus: 1 })

module.exports = mongoose.model("DriveCandidate", DriveCandidateSchema)
