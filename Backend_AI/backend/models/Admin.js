const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Admin",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password_hash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },

    // =========================
    // EMAIL VERIFICATION
    // =========================
    isEmailVerified: {
      type: Boolean,
      default: true,
    },

    // =========================
    // OTP (Email / Password Reset)
    // =========================
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },

    // =========================
    // BRUTE FORCE PROTECTION
    // =========================
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    // =========================
    // GOOGLE AUTHENTICATOR (TOTP)
    // =========================
    isTOTPEnabled: {
      type: Boolean,
      default: false,
    },

    totpSecret: {
      type: String,
    },

    // =========================
    // DEVICE VERIFICATION
    // (USED ONLY FOR PLATFORM ADMIN)
    // =========================
    trustedDeviceHash: {
      type: String, // hashed device fingerprint
      default: null,
    },

    // =========================
    // AUDIT LOGS
    // =========================
    loginHistory: [
      {
        ip: {
          type: String,
        },
        time: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

AdminSchema.index({ role: 1 });
AdminSchema.index({ email: 1, role: 1 });
AdminSchema.index({ lockUntil: 1 });
AdminSchema.index({ otpExpiry: 1 });

module.exports = mongoose.model("Admin", AdminSchema);
