const mongoose = require("mongoose");

const InvitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    invitedByHodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "invited", "accepted", "expired", "revoked"],
      default: "pending",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    meta: {
      // Optional import metadata from invite forms for traceability.
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    inviteToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

InvitationSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "invited"] } },
  }
);
InvitationSchema.index({ collegeId: 1, departmentId: 1, status: 1, createdAt: -1 });
InvitationSchema.index({ invitedByHodId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Invitation", InvitationSchema);
