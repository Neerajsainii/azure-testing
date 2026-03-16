const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    criteria: {
      minAtsScore: {
        type: Number,
        default: 0
      },
      minJobMatchScore: {
        type: Number,
        default: 0
      },
      allowedDepartments: {
        type: [String],
        default: []
      },
      allowedBatches: {
        type: [String],
        default: []
      },
      minResumeCompletion: {
        type: Number,
        default: 100
      },
      requiredSkills: {
        type: [String],
        default: []
      },
      minPercentage10: {
        type: Number,
        default: 0,
      },
      minPercentage12: {
        type: Number,
        default: 0,
      },
      maxBacklogs: {
        type: Number,
        default: 99,
      },
      maxGapYears: {
        type: Number,
        default: 99,
      },
      minAttendancePercent: {
        type: Number,
        default: 0,
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster filtering
CompanySchema.index({ collegeId: 1 });
CompanySchema.index({ collegeId: 1, name: 1 }, { unique: true }); // unique per college
CompanySchema.index({ "criteria.allowedDepartments": 1 });
CompanySchema.index({ "criteria.allowedBatches": 1 });

module.exports = mongoose.model("Company", CompanySchema);
