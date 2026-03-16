const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")

const User = require("../models/User")
const Admin = require("../models/Admin")
const College = require("../models/College")
const { env } = require("../config/env")
const { ROLES } = require("../constants/roles")
const { DASHBOARD_REDIRECTS, ALLOWED_BASE_PATHS } = require("../constants/navigation")
const Department = require("../models/Department")

const LOGIN_INTENTS = Object.freeze({
  STUDENT: "student",
  ADMINISTRATION: "administration",
  PLATFORM_ADMIN: "main",
});

const ADMIN_LOGIN_ROLES = Object.freeze([
  ROLES.PRINCIPAL,
  ROLES.HOD,
  ROLES.PLACEMENT_OFFICER,
]);

function normalizeSelectedRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (!value) return null;
  if (value === ROLES.PLACEMENT) return ROLES.PLACEMENT_OFFICER;
  return value;
}

function assertLoginIntent(role, intent, selectedRole) {
  const normalizedIntent = String(intent || "").trim().toLowerCase();

  if (!normalizedIntent) return;

  if (!Object.values(LOGIN_INTENTS).includes(normalizedIntent)) {
    const error = new Error("Invalid login intent");
    error.statusCode = 400;
    error.code = "INVALID_LOGIN_INTENT";
    throw error;
  }

  if (normalizedIntent === LOGIN_INTENTS.STUDENT) {
    if (role === ROLES.PLATFORM_ADMIN) {
      const error = new Error("Platform admin must use /main");
      error.statusCode = 403;
      error.code = "LOGIN_ROUTE_MISMATCH";
      throw error;
    }

    if (ADMIN_LOGIN_ROLES.includes(role)) {
      const error = new Error("Administrative accounts must use /administration-login");
      error.statusCode = 403;
      error.code = "LOGIN_ROUTE_MISMATCH";
      throw error;
    }

    return;
  }

  if (normalizedIntent === LOGIN_INTENTS.ADMINISTRATION) {
    const normalizedSelectedRole = normalizeSelectedRole(selectedRole);

    if (!normalizedSelectedRole || !ADMIN_LOGIN_ROLES.includes(normalizedSelectedRole)) {
      const error = new Error("Role selection is required for administration login");
      error.statusCode = 400;
      error.code = "ROLE_SELECTION_REQUIRED";
      throw error;
    }

    if (normalizedSelectedRole !== role) {
      const error = new Error("Invalid Role Selected");
      error.statusCode = 403;
      error.code = "INVALID_ROLE_SELECTED";
      throw error;
    }

    return;
  }

  if (normalizedIntent === LOGIN_INTENTS.PLATFORM_ADMIN) {
    if (role !== ROLES.PLATFORM_ADMIN) {
      const error = new Error("Unauthorized access to /main");
      error.statusCode = 403;
      error.code = "PLATFORM_ADMIN_ONLY";
      throw error;
    }
  }
}
const Resume = require("../models/Resume")

const logAudit = require("../utils/auditLogger")
const { logger } = require("../utils/logger")
const sendEmail = require("../utils/sendEmail")
const generateOTP = require("../utils/generateOTP")
const { hashOtp, verifyOtp } = require("../utils/otpSecurity")

const GENERIC_AUTH_ERROR = "Invalid email or password"

const normalizeEmail = (value) => String(value || "").trim().toLowerCase()

const findAccountByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email)
  const admin = await Admin.findOne({ email: normalizedEmail })
  if (admin) return { account: admin, type: "admin" }

  const user = await User.findOne({ email: normalizedEmail })
  if (user) return { account: user, type: "student" }

  return null
}

function normalizeRole(role, email) {
  const value = String(role || "")
  const mail = normalizeEmail(email)
  if (mail === env.platformAdminEmail) return ROLES.PLATFORM_ADMIN
  if (value === ROLES.PLACEMENT) return ROLES.PLACEMENT_OFFICER
  if (value === ROLES.STANDALONE_STUDENT) return ROLES.STUDENT
  return value || ROLES.STUDENT
}

function computeRedirectTo(role, isStandalone) {
  if (role === ROLES.STUDENT && isStandalone) return DASHBOARD_REDIRECTS[ROLES.STANDALONE_STUDENT]
  if (DASHBOARD_REDIRECTS[role]) return DASHBOARD_REDIRECTS[role]
  return "/login"
}

function computeAllowedBasePaths(role, isStandalone) {
  if (role === ROLES.STUDENT && isStandalone) return ALLOWED_BASE_PATHS[ROLES.STANDALONE_STUDENT] || []
  if (ALLOWED_BASE_PATHS[role]) return ALLOWED_BASE_PATHS[role]
  return []
}

function issueAccessToken(account, role) {
  const csrfToken = crypto.randomBytes(32).toString("hex")
  const tokenId = crypto.randomUUID()
  const accessToken = jwt.sign(
    {
      id: account._id.toString(),
      role,
      csrfToken,
      jti: tokenId,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
      subject: account._id.toString(),
      algorithm: "HS256",
    }
  )

  const decoded = jwt.decode(accessToken)
  const expiresAt = typeof decoded?.exp === "number" ? decoded.exp : null
  return { accessToken, csrfToken, expiresAt }
}

async function recordFailedLogin(account, req) {
  if (!account) {
    await logAudit(null, "LOGIN_FAILED", "auth", null, req)
    return
  }

  account.failedLoginAttempts = Number(account.failedLoginAttempts || 0) + 1
  if (account.failedLoginAttempts >= env.loginMaxFailedAttempts) {
    account.lockUntil = new Date(Date.now() + env.loginLockMinutes * 60 * 1000)
  }
  await account.save()
  await logAudit(account, "LOGIN_FAILED", "auth", account._id, req)
}

function buildLockedAccountError() {
  const error = new Error("Account temporarily locked due to repeated failed logins. Please try again later.")
  error.statusCode = 423
  error.code = "ACCOUNT_LOCKED"
  return error
}

/* ==============================
   STUDENT SIGNUP
============================== */
exports.signup = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      collegeName,
      collegeId,
      mobileNumber,
      department,
      year,
      batch,
    } = req.body

    const normalizedEmail = normalizeEmail(email)

    let user = await User.findOne({ email: normalizedEmail })
    if (user && user.isEmailVerified) {
      return res.status(409).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, env.bcryptRounds)

    let college = null
    const normalizedCollegeName = String(collegeName || "").trim()
    if (normalizedCollegeName) {
      college = await College.findOne({ name: normalizedCollegeName })
      if (!college) {
        college = await College.create({
          name: normalizedCollegeName,
          createdBy: null,
        })
      }
    }

    // Validate department against Department collection (case-insensitive exact match)
    let resolvedDepartment = null
    let resolvedDepartmentId = null
    const normalizedDept = String(department || "").trim()
    const effectiveCollegeId = college?._id || collegeId || null
    if (normalizedDept && effectiveCollegeId && collegeId) {
      const deptRegex = new RegExp(`^${normalizedDept.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}$`, "i")
      const deptRow = await Department.findOne({
        collegeId: effectiveCollegeId,
        name: deptRegex,
      })
      if (!deptRow) {
        return res.status(400).json({
          message: "Invalid department. Please select a valid department from the list.",
        })
      }
      resolvedDepartment = deptRow.name
      resolvedDepartmentId = deptRow._id
    }

    if (!user) {
      user = await User.create({
        name,
        email: normalizedEmail,
        password_hash: hashedPassword,
        role: ROLES.STUDENT,
        collegeName: normalizedCollegeName || null,
        collegeId: college?._id || null,
        mobileNumber: mobileNumber || null,
        department: resolvedDepartment || (normalizedDept || null),
        departmentId: resolvedDepartmentId || null,
        year: year || null,
        batch: batch || null,
        isEmailVerified: !env.emailVerificationRequired,
      })
    } else {
      user.name = name
      user.password_hash = hashedPassword
      user.mobileNumber = mobileNumber || null
      user.department = resolvedDepartment || (normalizedDept || null)
      user.departmentId = resolvedDepartmentId || user.departmentId || null
      user.year = year || null
      user.batch = batch || null
      user.collegeName = normalizedCollegeName || null
      user.collegeId = college?._id || collegeId || user.collegeId || null
      if (!user.isEmailVerified && !env.emailVerificationRequired) user.isEmailVerified = true
    }

    await user.save()

    await Resume.updateOne(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          personalInfo: {
            fullName: name || "",
            email: normalizedEmail,
            phone: mobileNumber || "",
          },
        },
      },
      { upsert: true }
    )

    await logAudit(user, "STUDENT_SIGNUP", "user", user._id, req)

    if (env.emailVerificationRequired && !user.isEmailVerified) {
      const otp = generateOTP()
      user.otp = hashOtp(otp)
      user.otpExpiry = new Date(Date.now() + env.emailVerificationOtpTtlMinutes * 60 * 1000)
      await user.save()

      let emailSent = true;
      try {
        await sendEmail(
          user.email,
          "Verify your email",
          `Your verification code is: ${otp}\n\nThis code expires in ${env.emailVerificationOtpTtlMinutes} minutes.`
        )
      } catch (emailError) {
        logger.error("signup_email_failed", { email: user.email, error: emailError.message })
        emailSent = false;
      }

      await logAudit(user, "EMAIL_VERIFICATION_OTP_SENT", "auth", user._id, req)

      return res.status(202).json({
        message: "Signup successful. Please verify your email before signing in.",
        warning: emailSent ? undefined : "Failed to send verification email. Please try again later."
      })
    }

    return res.status(200).json({ message: "Signup successful. You can now sign in." })
  } catch (err) {
    return next(err)
  }
}

/* ==============================
   LOGIN (STUDENT / ADMIN / SUPER ADMIN)
============================== */
exports.login = async (req, res, next) => {
  try {
    const { email, password, loginIntent, selectedRole } = req.body

    const normalizedEmail = normalizeEmail(email)
    const result = await findAccountByEmail(normalizedEmail)
    if (!result) {
      await recordFailedLogin(null, req)
      return res.status(401).json({ message: GENERIC_AUTH_ERROR })
    }

    const { account, type } = result

    if (account.lockUntil && account.lockUntil.getTime() > Date.now()) {
      await logAudit(account, "LOGIN_FAILED", "auth", account._id, req)
      throw buildLockedAccountError()
    }

    const hasPassword = typeof account.password_hash === "string" && account.password_hash.length > 0
    const isMatch = hasPassword ? await bcrypt.compare(password, account.password_hash) : false
    if (!isMatch) {
      await recordFailedLogin(account, req)
      return res.status(401).json({ message: GENERIC_AUTH_ERROR })
    }

    if (type !== "admin" && env.emailVerificationRequired && !account.isEmailVerified) {
      await logAudit(account, "LOGIN_FAILED", "auth", account._id, req)
      return res.status(403).json({ message: "Please verify your email before logging in." })
    }

    const backendRole = normalizeRole(account.role, account.email)
    assertLoginIntent(backendRole, loginIntent, selectedRole)

    if (account.status === "suspended") {
      await logAudit(account, "LOGIN_FAILED", "auth", account._id, req)
      return res.status(403).json({ message: "Account is suspended. Please contact support." })
    }

    if (backendRole === ROLES.STUDENT) {
      const importedScope = Boolean(account.collegeId && account.departmentId && account.isStandalone === false)
      if (loginIntent === "student" && !importedScope) {
        await logAudit(account, "LOGIN_FAILED", "auth", account._id, req)
        return res.status(403).json({ message: "Only imported students can sign in here." })
      }
    }

    if (loginIntent === "main" && normalizeEmail(account.email) !== env.platformAdminEmail) {
      await logAudit(account, "LOGIN_FAILED", "auth", account._id, req)
      return res.status(403).json({ message: "Unauthorized access to platform admin." })
    }

    if (type === "student" && account.accountStatus === "INVITED") {
      await logAudit(account, "LOGIN_FAILED", "auth", account._id, req)
      return res.status(403).json({
        message: "Please activate your account using the invite link sent to your email.",
      })
    }

    if (type === "admin") {
      if (!["hod", "placement", "chairman", "principal", "admin"].includes(account.role)) {
        await logAudit(account, "LOGIN_FAILED", "auth", account._id, req)
        return res.status(403).json({ message: "Unauthorized role." })
      }
    }

    account.failedLoginAttempts = 0
    account.lockUntil = null
    account.lastLoginAt = new Date()
    await account.save()

    const { accessToken, csrfToken, expiresAt } = issueAccessToken(account, backendRole)
    const redirectTo = computeRedirectTo(backendRole, !!account.isStandalone)
    const allowedBasePaths = computeAllowedBasePaths(backendRole, !!account.isStandalone)

    await logAudit(account, "LOGIN_SUCCESS", "auth", account._id, req)

    return res.json({
      message: "Login successful",
      user: {
        id: account._id.toString(),
        name: account.name,
        email: account.email,
        role: backendRole,
      },
      accessToken,
      csrfToken,
      expiresAt,
      redirectTo,
      allowedBasePaths,
    })
  } catch (err) {
    return next(err)
  }
}

exports.requestEmailVerification = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email)

    const user = await User.findOne({ email: normalizedEmail })
    if (!env.emailVerificationRequired) {
      return res.status(200).json({ message: "Email verification is not required." })
    }

    if (!user || user.isEmailVerified) {
      return res.status(200).json({ message: "If an account exists, a verification code has been sent." })
    }

    const otp = generateOTP()
    user.otp = hashOtp(otp)
    user.otpExpiry = new Date(Date.now() + env.emailVerificationOtpTtlMinutes * 60 * 1000)
    await user.save()

    try {
      await sendEmail(
        user.email,
        "Verify your email",
        `Your verification code is: ${otp}\n\nThis code expires in ${env.emailVerificationOtpTtlMinutes} minutes.`
      )
    } catch (emailError) {
      logger.error("verification_email_failed", { email: user.email, error: emailError.message })
    }

    await logAudit(user, "EMAIL_VERIFICATION_OTP_SENT", "auth", user._id, req)

    return res.status(200).json({ message: "If an account exists, a verification code has been sent." })
  } catch (err) {
    return next(err)
  }
}

exports.confirmEmailVerification = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email)
    const otp = String(req.body?.otp || "").trim()

    if (!env.emailVerificationRequired) {
      return res.status(200).json({ message: "Email verification is not required." })
    }

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(400).json({ message: "Invalid verification code." })
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ message: "Email already verified." })
    }

    if (!user.otp || !user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
      return res.status(400).json({ message: "Invalid verification code." })
    }

    if (!verifyOtp(otp, user.otp)) {
      await logAudit(user, "EMAIL_VERIFICATION_FAILED", "auth", user._id, req)
      return res.status(400).json({ message: "Invalid verification code." })
    }

    user.isEmailVerified = true
    user.otp = null
    user.otpExpiry = null
    await user.save()

    await logAudit(user, "EMAIL_VERIFICATION_SUCCESS", "auth", user._id, req)
    return res.status(200).json({ message: "Email verified successfully." })
  } catch (err) {
    return next(err)
  }
}

exports.activateInvite = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email)
    const newPassword = String(req.body?.newPassword || "")
    const token = String(req.body?.token || "")

    if (!token) {
      return res.status(400).json({ message: "Activation token is required." })
    }

    const hashedPassword = await bcrypt.hash(newPassword, env.bcryptRounds)

    let user = await User.findOne({ email: normalizedEmail })
    if (user) {
      if (user.accountStatus !== "INVITED") {
        return res.status(400).json({ message: "Account is already active." })
      }
      if (user.inviteToken !== token) {
        return res.status(400).json({ message: "Invalid or expired activation link." })
      }
      if (!user.inviteTokenExpiry || user.inviteTokenExpiry < Date.now()) {
        return res.status(400).json({ message: "This activation link has expired. Please request a new invite." })
      }

      user.password_hash = hashedPassword
      user.accountStatus = "ACTIVE"
      user.isEmailVerified = true
      user.inviteToken = null
      user.inviteTokenExpiry = null
      user.otp = null
      user.otpExpiry = null
      await user.save()
      await logAudit(user, "INVITE_ACTIVATED", "auth", user._id, req)
      return res.status(200).json({ message: "Account activated. You can now sign in." })
    }

    const Invitation = require("../models/Invitation")
    const invitation = await Invitation.findOne({
      email: normalizedEmail,
      status: { $in: ["pending", "invited"] }
    })

    if (!invitation) {
      return res.status(400).json({ message: "Invalid activation request." })
    }

    if (invitation.inviteToken !== token) {
      return res.status(400).json({ message: "Invalid or expired activation link." })
    }

    if (!invitation.expiresAt || invitation.expiresAt < Date.now()) {
      return res.status(400).json({ message: "This activation link has expired. Please request a new invite." })
    }

    const deptRow = await Department.findById(invitation.departmentId).lean()

    user = new User({
      email: invitation.email,
      name: invitation.meta?.name || invitation.email.split("@")[0],
      role: ROLES.STUDENT,
      collegeId: invitation.collegeId,
      departmentId: invitation.departmentId,
      department: invitation.meta?.department || deptRow?.name || null,
      year: invitation.meta?.year || null,
      batch: invitation.meta?.batch || null,
      password_hash: hashedPassword,
      accountStatus: "ACTIVE",
      isEmailVerified: true,
      invitedBy: invitation.invitedByHodId,
      isStandalone: false,
    })

    await user.save()

    invitation.status = "accepted"
    invitation.acceptedAt = new Date()
    invitation.inviteToken = null
    await invitation.save()

    await logAudit(user, "STUDENT_INVITE_ACTIVATED", "auth", user._id, req)
    return res.status(200).json({ message: "Account activated. You can now sign in." })

  } catch (err) {
    return next(err)
  }
}

/* ==============================
   GET SESSION (CURRENT USER)
============================== */
exports.getSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    const account = req.user
    const accountType = account.constructor.modelName
    const rawRole = accountType === "User" ? (account.role || ROLES.STUDENT) : account.role
    const backendRole = normalizeRole(rawRole, account.email)
    const isStandalone = accountType === "User" ? !!account.isStandalone : false
    const redirectTo = computeRedirectTo(backendRole, isStandalone)
    const allowedBasePaths = computeAllowedBasePaths(backendRole, isStandalone)

    return res.json({
      user: {
        id: account._id.toString(),
        name: account.name,
        email: account.email,
        role: backendRole,
      },
      accessToken: req.headers.authorization?.split(" ")[1] || null,
      csrfToken: req.auth?.csrfToken || null,
      expiresAt: req.auth?.exp || null,
      redirectTo,
      allowedBasePaths,
    })
  } catch (err) {
    return next(err)
  }
}

/* ==============================
   LOGOUT
============================== */
exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAudit(req.user, "LOGOUT", "auth", req.user._id, req)
    }

    return res.json({ message: "Logout successful" })
  } catch (err) {
    return next(err)
  }
}

/* ==============================
   GOOGLE OAUTH CALLBACK
============================== */
exports.googleCallback = async (req, res, next) => {
  try {
    const admin = req.user
    const { accessToken, csrfToken, expiresAt } = issueAccessToken(admin, ROLES.PLATFORM_ADMIN)

    await logAudit(admin, "LOGIN_SUCCESS_GOOGLE", "auth", admin._id, req)

    return res.json({
      message: "Platform Admin login successful",
      user: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: ROLES.PLATFORM_ADMIN,
      },
      accessToken,
      csrfToken,
      expiresAt,
    })
  } catch (error) {
    return next(error)
  }
}
