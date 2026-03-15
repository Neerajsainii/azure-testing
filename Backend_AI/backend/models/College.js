const mongoose = require("mongoose");

const CollegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    departmentLimit: {
      // null means "unlimited".
      type: Number,
      min: 1,
      default: null,
    },
    studentLimit: {
      // null means "unlimited".
      type: Number,
      min: 1,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

CollegeSchema.index({ isActive: 1 });
CollegeSchema.index({ departmentLimit: 1 });
CollegeSchema.index({ studentLimit: 1 });

module.exports = mongoose.model("College", CollegeSchema);
