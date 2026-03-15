const mongoose = require("mongoose")

const RevokedTokenSchema = new mongoose.Schema(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // userId is stored for audit purposes but is NOT required and is never
    // used in revocation lookups (authMiddleware queries by jti only).
    // Making it optional prevents logout from failing when userId is
    // unavailable (e.g. token already partially decoded).
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
)

// TTL index — MongoDB automatically deletes documents after expiresAt.
// expireAfterSeconds: 0 means delete at exactly the expiresAt timestamp.
// This keeps the collection lean and prevents unbounded growth.
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model("RevokedToken", RevokedTokenSchema)