const mongoose = require("mongoose");

const CompanyShortlistSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    atsScore: {
      type: Number,
      default: 0
    },
    jobMatchScore: {
      type: Number,
      default: 0
    },
    shortlistedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Ensure a student is shortlisted only once per company
CompanyShortlistSchema.index({ companyId: 1, studentId: 1 }, { unique: true });

// Optimize sorting and filtering
CompanyShortlistSchema.index({ jobMatchScore: -1 });
CompanyShortlistSchema.index({ shortlistedAt: -1 });

module.exports = mongoose.model("CompanyShortlist", CompanyShortlistSchema);
