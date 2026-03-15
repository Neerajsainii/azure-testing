const mongoose = require("mongoose");

const ResumeStatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    personalInfoCompleted: {
      type: Boolean,
      default: false
    },

    educationCompleted: {
      type: Boolean,
      default: false
    },

    skillsCompleted: {
      type: Boolean,
      default: false
    },

    projectsCompleted: {
      type: Boolean,
      default: false
    },

    certificationsCompleted: {
      type: Boolean,
      default: false
    },

    overallCompletion: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ResumeStatus", ResumeStatusSchema);
