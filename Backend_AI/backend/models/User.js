const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles")

const UserSchema = new mongoose.Schema(
  {
    /* =====================
       BASIC INFO
    ====================== */
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // clerkId: {
    //   type: String,
    //   default: null
    // },

    password_hash: {
      type: String,
      required: false
    },

    collegeName: {
      type: String,
      default: null,
    },

    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      default: null,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null
    },

    mobileNumber: {
      type: String,
      default: null,
    },
    /* =====================
       ROLE MANAGEMENT
    ====================== */
    role: {
      type: String,
      enum: [
        ROLES.PLATFORM_ADMIN,
        ROLES.PLACEMENT_OFFICER,
        ROLES.STANDALONE_STUDENT,
        ROLES.STUDENT,
        ROLES.HOD,
        ROLES.PRINCIPAL,
        // Legacy roles kept for backward compatibility in existing DBs.
        ROLES.PLACEMENT,
        ROLES.ADMIN,
      ],
      default: ROLES.STUDENT
    },

    /* =====================
       ACADEMIC INFO (USED FOR FILTERS)
    ====================== */
    department: {
      type: String,
      default: null // CSE, IT, MECH, etc.
    },

    departmentType: {
      type: String,
      enum: ["UG", "PG"],
      default: "UG"
    },

    batch: {
      type: String,
      default: null // 2024, 2025, etc.
    },

    year: {
      type: Number,
      default: null // 1,2,3,4 (students)
    },

    cgpa: {
      type: Number,
      default: 0
    },

    placementStatus: {
      type: String,
      enum: ["placed", "applying", "available"],
      default: "available"
    },

    /* =====================
       HOD / STAFF INFO
    ====================== */
    office: String,
    officeHours: String,
    qualifications: String,
    achievements: String,
    bio: String,
    alternateEmail: String,
    emergencyContact: String,
    designation: String,
    employeeId: String,
    tenure: String,
    location: String,
    rollNo: String,

    /* =====================
       ACCOUNT STATUS
    ====================== */
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active"
    },

    accountStatus: {
      type: String,
      enum: ["INVITED", "ACTIVE"],
      default: "ACTIVE"
    },

    inviteToken: {
      type: String,
      default: null
    },

    inviteTokenExpiry: {
      type: Date,
      default: null
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    isStandalone: {
      type: Boolean,
      default: false
    },

    departmentAssignedByHod: {
      type: Boolean,
      default: false
    },

    /* =====================
       EMAIL VERIFICATION
    ====================== */
    isEmailVerified: {
      type: Boolean,
      default: false
    },

    otp: {
      type: String
    },

    otpExpiry: {
      type: Date
    },

    /* =====================
       SECURITY
    ====================== */
    failedLoginAttempts: {
      type: Number,
      default: 0
    },

    lockUntil: {
      type: Date,
      default: null
    },

    /* =====================
       AUDIT / CONTROL
    ====================== */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
      // Principal/Admin who created HOD/Placement
    },

    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

UserSchema.index({ role: 1 });
UserSchema.index({ email: 1, role: 1 });
// UserSchema.index({ clerkId: 1 });
UserSchema.index({ lockUntil: 1 });
UserSchema.index({ otpExpiry: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ batch: 1 });
UserSchema.index({ year: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ inviteToken: 1 });
UserSchema.index({ inviteTokenExpiry: 1 });
UserSchema.index({ collegeId: 1 });
UserSchema.index({ departmentId: 1 });
UserSchema.index({ department: 1, year: 1 });

UserSchema.pre("save", async function () {
  if (this.inviteTokenExpiry && this.inviteTokenExpiry < Date.now()) {
    this.inviteToken = null;
    this.inviteTokenExpiry = null;
  }
});

module.exports = mongoose.model("User", UserSchema);
