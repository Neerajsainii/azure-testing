const mongoose = require("mongoose")

const StudentAcademicProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      default: null,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    section: {
      type: String,
      default: "",
      trim: true,
    },
    year: {
      type: Number,
      default: null,
    },
    batch: {
      type: String,
      default: "",
      trim: true,
    },
    cgpa: {
      type: Number,
      default: 0,
    },
    percentage10: {
      type: Number,
      default: 0,
    },
    percentage12: {
      type: Number,
      default: 0,
    },
    backlogsCount: {
      type: Number,
      default: 0,
    },
    gapYears: {
      type: Number,
      default: 0,
    },
    attendancePercent: {
      type: Number,
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
)

StudentAcademicProfileSchema.index({ collegeId: 1, departmentId: 1, year: 1 })
StudentAcademicProfileSchema.index({ cgpa: -1 })
StudentAcademicProfileSchema.index({ attendancePercent: -1 })
StudentAcademicProfileSchema.index({ backlogsCount: 1 })
StudentAcademicProfileSchema.index({ skills: 1 })

module.exports = mongoose.model("StudentAcademicProfile", StudentAcademicProfileSchema)
