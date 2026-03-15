const mongoose = require("mongoose");

const ApprovalSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  department: {
    type: String,
    required: true
  },
  requestType: {
    type: String,
    enum: ["Resume Approval", "Profile Update", "Leave Request"],
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  requestDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("Approval", ApprovalSchema);
