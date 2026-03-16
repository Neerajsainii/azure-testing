const mongoose = require("mongoose");

const AIResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null
    },

    aiType: {
      type: String,
      enum: ["ATS", "SKILL", "JOB_MATCH", "PROJECT"],
      required: true
    },

    score: {
      type: Number,
      default: null
    },

    result: {
      type: Object,   // full AI JSON output
      required: true
    },

    modelUsed: {
      type: String,
      default: "gpt-4"
    },

    promptVersion: {
      type: String,
      default: "v1"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIResult", AIResultSchema);
