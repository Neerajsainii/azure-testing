const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true,
    },
    hodName: {
      type: String,
      trim: true,
      default: ""
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

DepartmentSchema.index({ collegeId: 1, name: 1 }, { unique: true });
DepartmentSchema.index({ createdBy: 1, collegeId: 1 });

module.exports = mongoose.model("Department", DepartmentSchema);
