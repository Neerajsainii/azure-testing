const Invitation = require("../models/Invitation");
const logAudit = require("../utils/auditLogger");
const path = require("path")
const Department = require("../models/Department")
const User = require("../models/User")
const StudentAcademicProfile = require("../models/StudentAcademicProfile")
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto")
const XLSX = require("xlsx")
const { env } = require("../config/env")
const { ROLES } = require("../constants/roles")
const { logger } = require("../utils/logger")

const ACTIVE_INVITE_STATUSES = ["pending", "invited"]
const VALID_STUDENT_YEARS = new Set([2, 3, 4])
const MAX_IMPORT_ROWS = 5000
const MAX_IMPORT_FILE_SIZE_BYTES = 4 * 1024 * 1024
const BASE64_PAYLOAD_REGEX = /^[A-Za-z0-9+/]*={0,2}$/
const MAX_FILE_NAME_LENGTH = 255
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i
const ALLOWED_IMPORT_EXTENSIONS = new Set(["csv", "xlsx"])
const ALLOWED_IMPORT_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
])

const MIME_TO_EXTENSIONS = Object.freeze({
  "text/csv": ["csv"],
  "application/csv": ["csv"],
  "application/vnd.ms-excel": ["csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
})

const HEADER_ALIASES = Object.freeze({
  name: ["name", "studentname", "fullname", "studentfullname"],
  email: ["email", "emailid", "studentemail", "emailaddress", "mail"],
  year: ["year", "studentyear", "academicyear", "currentyear"],
  section: ["section", "sec"],
  rollNo: ["rollno", "usn", "universityseatnumber", "enrollmentno", "studentid", "studentusn", "rollnumber"],
})

function buildInviteExpiryDate() {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + Number(env.inviteExpiryHours || 168))
  return expiresAt
}

function normalizeEmail(value) {
  return String(value || "").toLowerCase().trim()
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

function parseStudentYear(value) {
  const raw = String(value ?? "").trim().toLowerCase()
  if (!raw) return null

  const numeric = Number(raw)
  if (Number.isInteger(numeric) && VALID_STUDENT_YEARS.has(numeric)) return numeric

  if (raw.includes("second") || raw.includes("2nd")) return 2
  if (raw.includes("third") || raw.includes("3rd")) return 3
  if (raw.includes("fourth") || raw.includes("4th")) return 4

  const match = raw.match(/\b([234])(?:st|nd|rd|th)?\b/)
  if (match) {
    const parsed = Number(match[1])
    if (VALID_STUDENT_YEARS.has(parsed)) return parsed
  }

  return null
}

function normalizeRow(row) {
  const normalized = {}
  for (const [key, value] of Object.entries(row || {})) {
    normalized[normalizeHeader(key)] = value
  }
  return normalized
}

function pickValue(normalizedRow, aliases) {
  for (const alias of aliases) {
    if (normalizedRow[alias] !== undefined && normalizedRow[alias] !== null) {
      return normalizedRow[alias]
    }
  }
  return ""
}

function normalizeMimeType(value) {
  return String(value || "").trim().toLowerCase()
}

function sanitizeUploadedFileName(fileName) {
  const rawName = String(fileName || "").trim()
  if (!rawName) return ""

  if (/(^|[\\/])\.\.([\\/]|$)/.test(rawName)) {
    const error = new Error("Invalid file name")
    error.statusCode = 400
    throw error
  }

  const baseName = path.basename(rawName)
  const sanitized = baseName
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .trim()
    .slice(0, MAX_FILE_NAME_LENGTH)

  if (!sanitized || sanitized === "." || sanitized === "..") {
    const error = new Error("Invalid file name")
    error.statusCode = 400
    throw error
  }

  return sanitized
}

function extractBase64Payload(fileBase64) {
  const payload = String(fileBase64 || "").trim()
  if (!payload) {
    const error = new Error("fileBase64 is required")
    error.statusCode = 400
    throw error
  }

  const dataUriMatch = payload.match(/^data:([^;,]+);base64,([\s\S]+)$/i)
  if (dataUriMatch) {
    return {
      mimeTypeFromDataUri: normalizeMimeType(dataUriMatch[1]),
      rawBase64: dataUriMatch[2],
    }
  }

  if (payload.startsWith("data:")) {
    const error = new Error("Invalid base64 payload")
    error.statusCode = 400
    throw error
  }

  return {
    mimeTypeFromDataUri: null,
    rawBase64: payload,
  }
}

function resolveUploadMetadata({ fileName, fileMimeType, mimeTypeFromDataUri }) {
  const normalizedMimeType = normalizeMimeType(fileMimeType || mimeTypeFromDataUri)
  if (!normalizedMimeType) {
    const error = new Error("fileMimeType is required and must be CSV/XLSX")
    error.statusCode = 400
    throw error
  }

  if (normalizedMimeType && !ALLOWED_IMPORT_MIME_TYPES.has(normalizedMimeType)) {
    const error = new Error("Unsupported file MIME type. Upload CSV or XLSX.")
    error.statusCode = 400
    throw error
  }

  const sanitizedFileName = sanitizeUploadedFileName(fileName)
  const explicitExtension = sanitizedFileName.includes(".")
    ? sanitizedFileName.split(".").pop()?.toLowerCase()
    : ""

  if (explicitExtension && !ALLOWED_IMPORT_EXTENSIONS.has(explicitExtension)) {
    const error = new Error("Unsupported file format. Upload CSV or XLSX.")
    error.statusCode = 400
    throw error
  }

  if (normalizedMimeType && explicitExtension) {
    const allowedExtensions = MIME_TO_EXTENSIONS[normalizedMimeType] || []
    if (!allowedExtensions.includes(explicitExtension)) {
      const error = new Error("File extension does not match MIME type")
      error.statusCode = 400
      throw error
    }
  }

  const effectiveExtension = explicitExtension || MIME_TO_EXTENSIONS[normalizedMimeType]?.[0]
  if (!effectiveExtension || !ALLOWED_IMPORT_EXTENSIONS.has(effectiveExtension)) {
    const error = new Error("Unable to determine upload file type")
    error.statusCode = 400
    throw error
  }

  return {
    fileName: sanitizedFileName || null,
    fileExt: effectiveExtension,
    mimeType: normalizedMimeType || null,
  }
}

function bufferLooksLikeZip(fileBuffer) {
  return fileBuffer.length >= 4
    && fileBuffer[0] === 0x50
    && fileBuffer[1] === 0x4b
    && [0x03, 0x05, 0x07].includes(fileBuffer[2])
    && [0x04, 0x06, 0x08].includes(fileBuffer[3])
}

function bufferLooksLikeCsv(fileBuffer) {
  const sample = fileBuffer.subarray(0, Math.min(fileBuffer.length, 2048))
  for (const byte of sample) {
    if (byte === 0x00) return false
    const isAllowedControl = byte === 0x09 || byte === 0x0a || byte === 0x0d
    if (!isAllowedControl && byte < 0x20) return false
  }
  return true
}

function enforceUploadSignature(fileBuffer, uploadMeta) {
  if (uploadMeta.fileExt === "xlsx" && !bufferLooksLikeZip(fileBuffer)) {
    const error = new Error("Uploaded file content does not match XLSX format")
    error.statusCode = 400
    throw error
  }

  if (uploadMeta.fileExt === "csv" && !bufferLooksLikeCsv(fileBuffer)) {
    const error = new Error("Uploaded file content does not match CSV format")
    error.statusCode = 400
    throw error
  }
}

function decodeBase64File(fileBase64, uploadMetadata = {}) {
  const { rawBase64, mimeTypeFromDataUri } = extractBase64Payload(fileBase64)
  const uploadMeta = resolveUploadMetadata({
    fileName: uploadMetadata.fileName,
    fileMimeType: uploadMetadata.fileMimeType,
    mimeTypeFromDataUri,
  })

  const normalizedPayload = String(rawBase64 || "").replace(/\s+/g, "")
  if (!normalizedPayload || normalizedPayload.length % 4 === 1 || !BASE64_PAYLOAD_REGEX.test(normalizedPayload)) {
    const error = new Error("Uploaded file is empty or invalid")
    error.statusCode = 400
    throw error
  }

  const fileBuffer = Buffer.from(normalizedPayload, "base64")
  const normalizedInput = normalizedPayload.replace(/=+$/, "")
  const normalizedDecoded = fileBuffer.toString("base64").replace(/=+$/, "")
  if (normalizedDecoded !== normalizedInput) {
    const error = new Error("Uploaded file is empty or invalid")
    error.statusCode = 400
    throw error
  }

  if (!fileBuffer.length) {
    const error = new Error("Uploaded file is empty or invalid")
    error.statusCode = 400
    throw error
  }

  if (fileBuffer.length > MAX_IMPORT_FILE_SIZE_BYTES) {
    const error = new Error("Uploaded file is too large. Keep file size under 4MB.")
    error.statusCode = 413
    throw error
  }

  enforceUploadSignature(fileBuffer, uploadMeta)
  return { fileBuffer, uploadMeta }
}

function parseImportRowsFromFile(fileBase64, uploadMetadata = {}) {
  const { fileBuffer, uploadMeta } = decodeBase64File(fileBase64, uploadMetadata)
  let workbook
  try {
    workbook = XLSX.read(fileBuffer, { type: "buffer" })
  } catch (parseError) {
    const error = new Error("Uploaded file could not be parsed as CSV/XLSX")
    error.statusCode = 400
    throw error
  }

  const firstSheetName = workbook.SheetNames?.[0]

  if (!firstSheetName) {
    const error = new Error("Could not find any worksheet in uploaded file")
    error.statusCode = 400
    throw error
  }

  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false })

  if (!Array.isArray(rows) || rows.length === 0) {
    const error = new Error("No student rows found in uploaded file")
    error.statusCode = 400
    throw error
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    const error = new Error(`Too many rows. Maximum allowed rows per import: ${MAX_IMPORT_ROWS}`)
    error.statusCode = 400
    throw error
  }

  return { rows, uploadMeta }
}

async function expireStaleInvites(scope = {}) {
  await Invitation.updateMany(
    {
      ...scope,
      status: { $in: ACTIVE_INVITE_STATUSES },
      expiresAt: { $lte: new Date() },
    },
    { $set: { status: "expired" } },
  )
}

/**
 * HOD invites a student to the platform.
 * Stores an invitation record only (no email sending).
 */
exports.inviteStudent = async (req, res) => {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim();
    const inviteMeta = {
      name: req.body?.name ? String(req.body.name).trim() : null,
      department: req.body?.department ? String(req.body.department).trim() : null,
      year: req.body?.year ? Number(req.body.year) : null,
      batch: req.body?.batch ? String(req.body.batch).trim() : null,
      rollNo: req.body?.rollNo ? String(req.body.rollNo).trim() : null,
    }

    if (req.user?.role !== ROLES.HOD) {
      console.log("HOD invite blocked: User is not HOD", req.user?.role)
      return res.status(403).json({ success: false, message: "Access denied. Only HODs can invite students." });
    }

    if (!email) {
      console.log("HOD invite blocked: Email empty")
      return res.status(400).json({ success: false, message: "email is required" });
    }

    if (!req.user.collegeId || !req.user.departmentId) {
      console.log("HOD invite blocked: Missing mapping", req.user.collegeId, req.user.departmentId)
      return res.status(400).json({
        success: false,
        message: "HOD account is missing collegeId/departmentId mapping",
      });
    }

    const department = await Department.findById(req.user.departmentId)
    if (!department) {
      return res.status(400).json({
        success: false,
        message: "HOD department mapping is invalid",
      })
    }

    if (!department.collegeId) {
      // Backward-compatible migration for legacy department rows without college mapping.
      department.collegeId = req.user.collegeId
      await department.save()
    }

    if (String(department.collegeId) !== String(req.user.collegeId)) {
      return res.status(400).json({
        success: false,
        message: "HOD department mapping does not belong to this college",
      })
    }

    await expireStaleInvites({
      collegeId: req.user.collegeId,
      departmentId: req.user.departmentId,
      invitedByHodId: req.user._id,
    })

    const activeInviteByEmail = await Invitation.findOne({
      email,
      status: { $in: ACTIVE_INVITE_STATUSES },
    }).lean()

    if (
      activeInviteByEmail &&
      (
        String(activeInviteByEmail.collegeId) !== String(req.user.collegeId) ||
        String(activeInviteByEmail.departmentId) !== String(req.user.departmentId)
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "This student already has an active invite in another department scope",
      })
    }

    const existingActiveInvite = await Invitation.findOne({
      email,
      collegeId: req.user.collegeId,
      departmentId: req.user.departmentId,
      status: { $in: ACTIVE_INVITE_STATUSES },
    })

    const expiresAt = buildInviteExpiryDate()
    const inviteToken = crypto.randomBytes(32).toString("hex")

    const invitation = await Invitation.findOneAndUpdate(
      existingActiveInvite
        ? { _id: existingActiveInvite._id }
        : { email, status: "pending" },
      {
        $set: {
          email,
          collegeId: req.user.collegeId,
          departmentId: req.user.departmentId,
          invitedByHodId: req.user._id,
          status: "pending",
          expiresAt,
          acceptedAt: null,
          revokedAt: null,
          revokedByUserId: null,
          meta: inviteMeta,
          inviteToken,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )

    const activationLink = `${env.frontendUrl}/register?token=${inviteToken}&email=${encodeURIComponent(email)}`
    let emailSent = true;
    try {
      await sendEmail(
        email,
        "Activate Your Student Account",
        `You have been invited to join the platform as a Student.\n\nPlease activate your account and set your password by clicking the link below:\n${activationLink}\n\nThis link will expire in ${env.inviteExpiryHours || 168} hours.`
      )
    } catch (emailError) {
      logger.error("invite_student_email_failed", { email, error: emailError.message })
      emailSent = false;
    }

    const action = existingActiveInvite ? "STUDENT_INVITE_RESENT" : "STUDENT_INVITED"
    await logAudit(req.user, action, "Invitation", invitation._id, req, {
      email,
      departmentId: req.user.departmentId,
      collegeId: req.user.collegeId,
      expiresAt,
    })

    return res.status(201).json({
      success: true,
      message: existingActiveInvite ? "Student invite resent successfully." : "Student invited successfully.",
      warning: emailSent ? undefined : "Student saved, but failed to send activation email.",
      invitation: {
        id: invitation._id,
        email: invitation.email,
        collegeId: invitation.collegeId,
        departmentId: invitation.departmentId,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Student already has an active invite",
      })
    }
    logger.error("invite_student_failed", {
      requestId: req.requestId || null,
      userId: req.user?._id?.toString?.() || null,
      role: req.user?.role || null,
      message: error.message,
    })
    return res.status(500).json({
      success: false,
      message: "Internal server error during student invitation."
    });
  }
};

exports.listInvites = async (req, res) => {
  try {
    if (req.user?.role !== ROLES.HOD) {
      return res.status(403).json({ success: false, message: "Access denied. Only HODs can view invites." })
    }

    await expireStaleInvites({
      collegeId: req.user.collegeId,
      departmentId: req.user.departmentId,
      invitedByHodId: req.user._id,
    })

    const status = String(req.query?.status || "").trim()
    const query = {
      collegeId: req.user.collegeId,
      departmentId: req.user.departmentId,
      invitedByHodId: req.user._id,
    }
    if (status) query.status = status

    const invites = await Invitation.find(query).sort({ createdAt: -1 }).limit(500).lean()
    return res.status(200).json({
      success: true,
      invites: invites.map((invite) => ({
        id: invite._id,
        email: invite.email,
        status: invite.status,
        expiresAt: invite.expiresAt,
        acceptedAt: invite.acceptedAt,
        revokedAt: invite.revokedAt,
        createdAt: invite.createdAt,
      })),
    })
  } catch (error) {
    logger.error("list_invites_failed", {
      requestId: req.requestId || null,
      userId: req.user?._id?.toString?.() || null,
      role: req.user?.role || null,
      message: error.message,
    })
    return res.status(500).json({ success: false, message: "Internal server error during invite listing." })
  }
}

exports.revokeInvite = async (req, res) => {
  try {
    if (req.user?.role !== ROLES.HOD) {
      return res.status(403).json({ success: false, message: "Access denied. Only HODs can revoke invites." })
    }

    const inviteId = req.params?.id
    if (!inviteId) return res.status(400).json({ success: false, message: "Invite id is required" })

    const invitation = await Invitation.findOneAndUpdate(
      {
        _id: inviteId,
        invitedByHodId: req.user._id,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId,
        status: { $in: ACTIVE_INVITE_STATUSES },
      },
      {
        $set: {
          status: "revoked",
          revokedAt: new Date(),
          revokedByUserId: req.user._id,
        },
      },
      { new: true }
    )

    if (!invitation) {
      return res.status(404).json({ success: false, message: "Active invite not found" })
    }

    await logAudit(req.user, "STUDENT_INVITE_REVOKED", "Invitation", invitation._id, req, {
      email: invitation.email,
      departmentId: invitation.departmentId,
      collegeId: invitation.collegeId,
    })

    return res.status(200).json({ success: true, message: "Invite revoked successfully" })
  } catch (error) {
    logger.error("revoke_invite_failed", {
      requestId: req.requestId || null,
      userId: req.user?._id?.toString?.() || null,
      role: req.user?.role || null,
      message: error.message,
    })
    return res.status(500).json({ success: false, message: "Internal server error during invite revocation." })
  }
}

exports.resendInvite = async (req, res) => {
  try {
    if (req.user?.role !== ROLES.HOD) {
      return res.status(403).json({ success: false, message: "Access denied. Only HODs can resend invites." })
    }

    const inviteId = req.params?.id
    if (!inviteId) return res.status(400).json({ success: false, message: "Invite id is required" })

    const expiresAt = buildInviteExpiryDate()
    const inviteToken = crypto.randomBytes(32).toString("hex")

    const invitation = await Invitation.findOneAndUpdate(
      {
        _id: inviteId,
        invitedByHodId: req.user._id,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId,
        status: { $in: ["pending", "invited", "expired", "revoked"] },
      },
      {
        $set: {
          status: "pending",
          expiresAt,
          acceptedAt: null,
          revokedAt: null,
          revokedByUserId: null,
          inviteToken,
        },
      },
      { new: true }
    )

    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invite not found" })
    }

    const activationLink = `${env.frontendUrl}/register?token=${inviteToken}&email=${encodeURIComponent(invitation.email)}`
    let emailSent = true;
    try {
      await sendEmail(
        invitation.email,
        "Activate Your Student Account (Resent)",
        `You have been invited to join the platform as a Student.\n\nPlease activate your account and set your password by clicking the link below:\n${activationLink}\n\nThis link will expire in ${env.inviteExpiryHours || 168} hours.`
      )
    } catch (emailError) {
      logger.error("resend_invite_email_failed", { email: invitation.email, error: emailError.message })
      emailSent = false;
    }

    await logAudit(req.user, "STUDENT_INVITE_RESENT", "Invitation", invitation._id, req, {
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      departmentId: invitation.departmentId,
      collegeId: invitation.collegeId,
    })

    return res.status(200).json({
      success: true,
      message: "Invite resent successfully",
      warning: emailSent ? undefined : "Invite resent, but failed to send activation email.",
      invitation: {
        id: invitation._id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (error) {
    logger.error("resend_invite_failed", {
      requestId: req.requestId || null,
      userId: req.user?._id?.toString?.() || null,
      role: req.user?.role || null,
      message: error.message,
    })
    return res.status(500).json({ success: false, message: "Internal server error during invite resend." })
  }
}

exports.bulkImportStudents = async (req, res) => {
  try {
    if (req.user?.role !== ROLES.HOD) {
      return res.status(403).json({ success: false, message: "Access denied. Only HODs can import students." })
    }

    if (!req.user.collegeId || !req.user.departmentId) {
      return res.status(400).json({
        success: false,
        message: "HOD account is missing collegeId/departmentId mapping",
      })
    }

    const department = await Department.findById(req.user.departmentId)
    if (!department) {
      return res.status(400).json({
        success: false,
        message: "HOD department mapping is invalid",
      })
    }

    if (!department.collegeId) {
      // Backward-compatible migration for legacy department rows without college mapping.
      department.collegeId = req.user.collegeId
      await department.save()
    }

    if (String(department.collegeId) !== String(req.user.collegeId)) {
      return res.status(400).json({
        success: false,
        message: "HOD department mapping does not belong to this college",
      })
    }

    const { rows, uploadMeta } = parseImportRowsFromFile(req.body?.fileBase64, {
      fileName: req.body?.fileName,
      fileMimeType: req.body?.fileMimeType,
    })

    const normalizedHeaderSet = new Set()
    for (const row of rows.slice(0, 25)) {
      for (const key of Object.keys(normalizeRow(row))) normalizedHeaderSet.add(key)
    }

    const missingRequiredColumns = ["name", "email", "year"].filter((field) => {
      return !HEADER_ALIASES[field].some((alias) => normalizedHeaderSet.has(alias))
    })

    if (missingRequiredColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingRequiredColumns.join(", ")}`,
      })
    }

    const rowResults = []
    const validRows = []
    const seenEmailsInFile = new Set()

    for (let i = 0; i < rows.length; i += 1) {
      const rowNumber = i + 2
      const normalized = normalizeRow(rows[i])

      const name = String(pickValue(normalized, HEADER_ALIASES.name) || "").trim()
      const email = normalizeEmail(pickValue(normalized, HEADER_ALIASES.email))
      const year = parseStudentYear(pickValue(normalized, HEADER_ALIASES.year))
      const section = String(pickValue(normalized, HEADER_ALIASES.section) || "").trim()
      const rollNo = String(pickValue(normalized, HEADER_ALIASES.rollNo) || "").trim()

      const hasAnyValue = [name, email, section, rollNo, pickValue(normalized, HEADER_ALIASES.year)]
        .some((value) => String(value || "").trim().length > 0)

      if (!hasAnyValue) {
        rowResults.push({
          rowNumber,
          status: "failed",
          reason: "Empty row",
          name: "",
          email: "",
          year: null,
        })
        continue
      }

      if (!name) {
        rowResults.push({
          rowNumber,
          status: "failed",
          reason: "Missing name",
          name,
          email,
          year,
        })
        continue
      }

      if (!email || !EMAIL_REGEX.test(email)) {
        rowResults.push({
          rowNumber,
          status: "failed",
          reason: "Invalid email",
          name,
          email,
          year,
        })
        continue
      }

      if (!VALID_STUDENT_YEARS.has(year)) {
        rowResults.push({
          rowNumber,
          status: "failed",
          reason: "Year must be 2, 3, or 4",
          name,
          email,
          year,
        })
        continue
      }

      if (section.length > 20) {
        rowResults.push({
          rowNumber,
          status: "failed",
          reason: "Section is too long",
          name,
          email,
          year,
        })
        continue
      }

      if (seenEmailsInFile.has(email)) {
        rowResults.push({
          rowNumber,
          status: "failed",
          reason: "Duplicate email in file",
          name,
          email,
          year,
        })
        continue
      }
      seenEmailsInFile.add(email)

      validRows.push({
        rowNumber,
        name,
        email,
        year,
        section,
        rollNo,
      })
    }

    const existingUsers = await User.find({
      email: { $in: validRows.map((row) => row.email) },
    })
      .select("email")
      .lean()
    const existingEmailSet = new Set(existingUsers.map((user) => normalizeEmail(user.email)))

    const inviteTokenExpiry = buildInviteExpiryDate()

    const rowsToCreate = []
    for (const row of validRows) {
      if (existingEmailSet.has(row.email)) {
        rowResults.push({
          rowNumber: row.rowNumber,
          status: "skipped",
          reason: "Email already exists",
          name: row.name,
          email: row.email,
          year: row.year,
        })
      } else {
        row.inviteToken = crypto.randomBytes(32).toString("hex")
        rowsToCreate.push(row)
      }
    }

    const departmentName = String(department.name || req.user.department || "").trim()

    const createOps = rowsToCreate.map((row) => ({
      updateOne: {
        filter: { email: row.email },
        update: {
          $setOnInsert: {
            name: row.name,
            email: row.email,
            role: ROLES.STUDENT,
            collegeId: req.user.collegeId,
            departmentId: req.user.departmentId,
            department: departmentName || null,
            year: row.year,
            status: "active",
            accountStatus: "INVITED",
            isStandalone: false,
            isEmailVerified: false,
            departmentAssignedByHod: true,
            invitedBy: req.user._id || null,
            createdBy: req.user._id || null,
            inviteToken: row.inviteToken,
            inviteTokenExpiry: inviteTokenExpiry,
          },
          $set: {
            ...(row.rollNo ? { rollNo: row.rollNo } : {})
          }
        },
        upsert: true,
      },
    }))

    let createdCount = 0
    const createdByYear = { secondYear: 0, thirdYear: 0, fourthYear: 0 }

    if (createOps.length > 0) {
      const bulkResult = await User.bulkWrite(createOps, { ordered: false })
      const upsertedIds = bulkResult?.upsertedIds || {}
      const profileOps = []

      for (const [indexStr, rawId] of Object.entries(upsertedIds)) {
        const opIndex = Number.isInteger(rawId?.index) ? rawId.index : Number(indexStr)
        const sourceRow = rowsToCreate[opIndex]
        if (!sourceRow) continue

        const userId = rawId && rawId._id ? rawId._id : rawId
        profileOps.push({
          updateOne: {
            filter: { userId },
            update: {
              $set: {
                collegeId: req.user.collegeId,
                departmentId: req.user.departmentId,
                year: sourceRow.year,
                section: sourceRow.section || "",
                batch: "",
              },
              $setOnInsert: {
                cgpa: 0,
                percentage10: 0,
                percentage12: 0,
                backlogsCount: 0,
                gapYears: 0,
                attendancePercent: 0,
                skills: [],
              },
            },
            upsert: true,
          },
        })

        rowResults.push({
          rowNumber: sourceRow.rowNumber,
          status: "success",
          reason: "Imported",
          name: sourceRow.name,
          email: sourceRow.email,
          year: sourceRow.year,
          rollNo: sourceRow.rollNo,
        })

        const activationLink = `${env.frontendUrl}/register?token=${sourceRow.inviteToken}&email=${encodeURIComponent(sourceRow.email)}`
        sendEmail(
          sourceRow.email,
          "Activate Your Student Account",
          `You have been invited to join the platform as a Student by your HOD.\n\nPlease activate your account and set your password by clicking the link below:\n${activationLink}\n\nThis link will expire in ${env.inviteExpiryHours || 168} hours.`
        ).catch((err) => logger.error("bulk_import_email_failed", { email: sourceRow.email, error: err.message }))

        createdCount += 1
        if (sourceRow.year === 2) createdByYear.secondYear += 1
        if (sourceRow.year === 3) createdByYear.thirdYear += 1
        if (sourceRow.year === 4) createdByYear.fourthYear += 1
      }

      const createdIndexSet = new Set(Object.keys(upsertedIds).map((value) => Number(value)))
      for (let i = 0; i < rowsToCreate.length; i += 1) {
        if (!createdIndexSet.has(i)) {
          rowResults.push({
            rowNumber: rowsToCreate[i].rowNumber,
            status: "skipped",
            reason: "Email already exists",
            name: rowsToCreate[i].name,
            email: rowsToCreate[i].email,
            year: rowsToCreate[i].year,
          })
        }
      }

      if (profileOps.length > 0) {
        await StudentAcademicProfile.bulkWrite(profileOps, { ordered: false })
      }
    }

    rowResults.sort((a, b) => a.rowNumber - b.rowNumber)

    const summary = {
      totalRows: rows.length,
      successCount: rowResults.filter((row) => row.status === "success").length,
      skippedCount: rowResults.filter((row) => row.status === "skipped").length,
      failedCount: rowResults.filter((row) => row.status === "failed").length,
      importedByYear: createdByYear,
      results: rowResults,
    }

    await logAudit(req.user, "HOD_BULK_IMPORT_STUDENTS", "User", null, req, {
      departmentId: req.user.departmentId,
      collegeId: req.user.collegeId,
      fileName: uploadMeta.fileName,
      fileMimeType: uploadMeta.mimeType,
      totalRows: summary.totalRows,
      successCount: summary.successCount,
      skippedCount: summary.skippedCount,
      failedCount: summary.failedCount,
      createdCount,
    })

    return res.status(200).json({
      success: true,
      message: "Bulk import completed",
      summary,
    })
  } catch (error) {
    logger.error("bulk_import_students_failed", {
      requestId: req.requestId || null,
      userId: req.user?._id?.toString?.() || null,
      role: req.user?.role || null,
      message: error.message,
    })
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error during bulk import.",
    })
  }
}

/* =========================
   LEGACY INVITE ACTIVATION (DISABLED)
   =========================

exports.activateInvitedStudent = async (req, res) => {};

*/
