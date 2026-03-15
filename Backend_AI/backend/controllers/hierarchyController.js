const User = require("../models/User")
const College = require("../models/College")
const Department = require("../models/Department")
const logAudit = require("../utils/auditLogger")
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto")
const { env } = require("../config/env")
const { ROLES } = require("../constants/roles")

function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex")
}

function buildInviteExpiryDate() {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + Number(env.inviteExpiryHours || 168))
  return expiresAt
}

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function buildRoleAssignmentError(message, code = "ROLE_ASSIGNMENT_REJECTED", statusCode = 409) {
  const error = new Error(message)
  error.code = code
  error.statusCode = statusCode
  return error
}

async function logRejectedAssignment(req, targetRole, email, reason) {
  await logAudit(req.user, "ROLE_ASSIGNMENT_REJECTED", "User", null, req, {
    targetRole,
    email,
    reason,
  })
}

function assertNotPlatformAdminEmail(email) {
  if (normalizeEmail(email) === env.platformAdminEmail) {
    throw buildRoleAssignmentError("This email is reserved for PLATFORM_ADMIN_EMAIL", "PLATFORM_ADMIN_EMAIL_RESERVED", 400)
  }
}

function assertAssignableFromExisting(existing, targetRole) {
  if (!existing) return

  if (existing.role === ROLES.PLATFORM_ADMIN) {
    throw buildRoleAssignmentError("Cannot modify platform admin role assignment", "ROLE_ASSIGNMENT_BLOCKED", 403)
  }

  if (existing.role === targetRole) return

  const allowedSourceRoles = [ROLES.STUDENT, ROLES.STANDALONE_STUDENT]
  if (!allowedSourceRoles.includes(existing.role)) {
    throw buildRoleAssignmentError(
      `User already has role '${existing.role}'. Use dedicated role management flow for role changes.`,
      "ROLE_CONFLICT",
      409
    )
  }
}

async function assertCollegeActive(collegeId) {
  const college = await College.findOne({ _id: collegeId, isActive: true }).lean()
  if (!college) {
    throw buildRoleAssignmentError("Active college mapping is required", "COLLEGE_NOT_FOUND", 400)
  }
  return college
}

exports.createPrincipal = async (req, res) => {
  console.log("createPrincipal req.body:", req.body)
  const email = normalizeEmail(req.body?.email)
  const collegeId = req.body?.collegeId || null

  if (!email || !isValidEmail(email)) {
    await logRejectedAssignment(req, ROLES.PRINCIPAL, email, "Invalid or missing email")
    return res.status(400).json({ message: "Valid email is required" })
  }

  if (!collegeId) {
    await logRejectedAssignment(req, ROLES.PRINCIPAL, email, "Missing collegeId")
    return res.status(400).json({ message: "collegeId is required" })
  }

  assertNotPlatformAdminEmail(email)
  await assertCollegeActive(collegeId)

  const existing = await User.findOne({ email })
  assertAssignableFromExisting(existing, ROLES.PRINCIPAL)

  const otherPrincipal = await User.findOne({
    role: ROLES.PRINCIPAL,
    collegeId,
    email: { $ne: email },
  }).lean()

  if (otherPrincipal) {
    await logRejectedAssignment(req, ROLES.PRINCIPAL, email, "College already has a principal")
    return res.status(409).json({ message: "This college already has an assigned principal" })
  }

  if (
    existing?.role === ROLES.PRINCIPAL &&
    existing.collegeId &&
    String(existing.collegeId) !== String(collegeId)
  ) {
    await logRejectedAssignment(req, ROLES.PRINCIPAL, email, "Principal belongs to another college")
    return res.status(409).json({ message: "Principal is already assigned to another college" })
  }

  const inviteToken = generateInviteToken()
  const inviteTokenExpiry = buildInviteExpiryDate()

  const principal = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        role: ROLES.PRINCIPAL,
        collegeId,
        departmentId: null,
        department: null,
        isStandalone: false,
        accountStatus: "INVITED",
        invitedBy: req.user?._id || null,
        inviteToken,
        inviteTokenExpiry,
      },
      $setOnInsert: {
        name: email.split("@")[0],
        isEmailVerified: false,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )

  const activationLink = `${env.frontendUrl}/register?token=${inviteToken}&email=${encodeURIComponent(email)}`

  let emailSent = true;
  try {
    await sendEmail(
      email,
      "Activate Your Principal Account",
      `You have been invited as a Principal.\n\nPlease activate your account and set your password by clicking the link below:\n${activationLink}\n\nThis link will expire in ${env.inviteExpiryHours || 168} hours.`
    )
  } catch (emailError) {
    console.error("create_principal_email_failed:", emailError.message)
    emailSent = false;
  }

  await logAudit(req.user, "CREATE_PRINCIPAL", "User", principal._id, req, {
    email: principal.email,
    collegeId: principal.collegeId,
  })

  return res.status(201).json({
    id: principal._id,
    email: principal.email,
    role: principal.role,
    collegeId: principal.collegeId,
    warning: emailSent ? undefined : "User created, but failed to send activation email."
  })
}

exports.createPlacementOfficer = async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  if (!email || !isValidEmail(email)) {
    await logRejectedAssignment(req, ROLES.PLACEMENT_OFFICER, email, "Invalid or missing email")
    return res.status(400).json({ message: "Valid email is required" })
  }

  assertNotPlatformAdminEmail(email)

  if (!req.user?.collegeId) {
    await logRejectedAssignment(req, ROLES.PLACEMENT_OFFICER, email, "Principal missing collegeId mapping")
    return res.status(400).json({ message: "Principal is missing collegeId mapping" })
  }

  await assertCollegeActive(req.user.collegeId)

  const existing = await User.findOne({ email })
  assertAssignableFromExisting(existing, ROLES.PLACEMENT_OFFICER)

  if (
    existing?.role === ROLES.PLACEMENT_OFFICER &&
    existing.collegeId &&
    String(existing.collegeId) !== String(req.user.collegeId)
  ) {
    await logRejectedAssignment(req, ROLES.PLACEMENT_OFFICER, email, "Placement officer belongs to another college")
    return res.status(409).json({ message: "Placement officer is already assigned to another college" })
  }

  const inviteToken = generateInviteToken()
  const inviteTokenExpiry = buildInviteExpiryDate()

  const placement = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        role: ROLES.PLACEMENT_OFFICER,
        collegeId: req.user.collegeId,
        departmentId: null,
        department: null,
        isStandalone: false,
        accountStatus: "INVITED",
        invitedBy: req.user?._id || null,
        inviteToken,
        inviteTokenExpiry,
      },
      $setOnInsert: {
        name: email.split("@")[0],
        isEmailVerified: false,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )

  const activationLink = `${env.frontendUrl}/register?token=${inviteToken}&email=${encodeURIComponent(email)}`
  let emailSent = true;
  try {
    await sendEmail(
      email,
      "Activate Your Placement Officer Account",
      `You have been invited as a Placement Officer.\n\nPlease activate your account and set your password by clicking the link below:\n${activationLink}\n\nThis link will expire in ${env.inviteExpiryHours || 168} hours.`
    )
  } catch (emailError) {
    console.error("create_placement_officer_email_failed:", emailError.message)
    emailSent = false;
  }

  await logAudit(req.user, "CREATE_PLACEMENT_OFFICER", "User", placement._id, req, {
    email: placement.email,
    collegeId: placement.collegeId,
  })

  return res.status(201).json({
    id: placement._id,
    email: placement.email,
    role: placement.role,
    collegeId: placement.collegeId,
    warning: emailSent ? undefined : "User created, but failed to send activation email."
  })
}

exports.createHod = async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const departmentId = req.body?.departmentId || null

  if (!email || !isValidEmail(email)) {
    await logRejectedAssignment(req, ROLES.HOD, email, "Invalid or missing email")
    return res.status(400).json({ message: "Valid email is required" })
  }

  if (!departmentId) {
    await logRejectedAssignment(req, ROLES.HOD, email, "Missing departmentId")
    return res.status(400).json({ message: "departmentId is required" })
  }

  assertNotPlatformAdminEmail(email)

  if (!req.user?.collegeId) {
    await logRejectedAssignment(req, ROLES.HOD, email, "Principal missing collegeId mapping")
    return res.status(400).json({ message: "Principal is missing collegeId mapping" })
  }

  await assertCollegeActive(req.user.collegeId)

  const department = await Department.findById(departmentId)
  if (!department) {
    await logRejectedAssignment(req, ROLES.HOD, email, "Invalid department for college")
    return res.status(400).json({ message: "departmentId does not belong to principal's college" })
  }

  if (!department.collegeId) {
    // Backward-compatible migration for legacy department rows without college mapping.
    department.collegeId = req.user.collegeId
    await department.save()
  }

  if (String(department.collegeId) !== String(req.user.collegeId)) {
    await logRejectedAssignment(req, ROLES.HOD, email, "Department belongs to another college")
    return res.status(400).json({ message: "departmentId does not belong to principal's college" })
  }

  const existing = await User.findOne({ email })
  assertAssignableFromExisting(existing, ROLES.HOD)

  const existingHodForDepartment = await User.findOne({
    role: ROLES.HOD,
    collegeId: req.user.collegeId,
    departmentId,
    email: { $ne: email },
  }).lean()

  if (existingHodForDepartment) {
    await logRejectedAssignment(req, ROLES.HOD, email, "Department already has HOD")
    return res.status(409).json({ message: "This department already has an assigned HOD" })
  }

  if (existing?.role === ROLES.HOD) {
    const scopeMismatch =
      (existing.collegeId && String(existing.collegeId) !== String(req.user.collegeId)) ||
      (existing.departmentId && String(existing.departmentId) !== String(departmentId))
    if (scopeMismatch) {
      await logRejectedAssignment(req, ROLES.HOD, email, "HOD belongs to another college/department")
      return res.status(409).json({ message: "HOD is already assigned to another department scope" })
    }
  }

  const inviteToken = generateInviteToken()
  const inviteTokenExpiry = buildInviteExpiryDate()

  const hod = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        role: ROLES.HOD,
        collegeId: req.user.collegeId,
        departmentId,
        department: department.name,
        isStandalone: false,
        accountStatus: "INVITED",
        invitedBy: req.user?._id || null,
        inviteToken,
        inviteTokenExpiry,
      },
      $setOnInsert: {
        name: email.split("@")[0],
        isEmailVerified: false,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )

  const activationLink = `${env.frontendUrl}/register?token=${inviteToken}&email=${encodeURIComponent(email)}`
  let emailSent = true;
  try {
    await sendEmail(
      email,
      "Activate Your HOD Account",
      `You have been invited as a Head of Department (${department.name}).\n\nPlease activate your account and set your password by clicking the link below:\n${activationLink}\n\nThis link will expire in ${env.inviteExpiryHours || 168} hours.`
    )
  } catch (emailError) {
    console.error("create_hod_email_failed:", emailError.message)
    emailSent = false;
  }

  await logAudit(req.user, "CREATE_HOD", "User", hod._id, req, {
    email: hod.email,
    collegeId: hod.collegeId,
    departmentId: hod.departmentId,
    department: hod.department,
  })

  return res.status(201).json({
    id: hod._id,
    email: hod.email,
    role: hod.role,
    collegeId: hod.collegeId,
    departmentId: hod.departmentId,
    warning: emailSent ? undefined : "User created, but failed to send activation email."
  })
}
