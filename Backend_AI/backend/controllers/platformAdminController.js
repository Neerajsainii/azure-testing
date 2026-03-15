const College = require("../models/College")
const Department = require("../models/Department")
const Invitation = require("../models/Invitation")
const User = require("../models/User")
const { ROLES } = require("../constants/roles")
const { getCollegeDepartmentCapacity } = require("../services/departmentCapacityService")
const logAudit = require("../utils/auditLogger")
const { logger } = require("../utils/logger")

const normalizeDepartmentLimit = (value) => {
  if (value === null || value === "" || Number(value) === 0) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    const error = new Error("departmentLimit must be a positive integer or 0 for unlimited")
    error.statusCode = 400
    error.code = "INVALID_DEPARTMENT_LIMIT"
    throw error
  }
  return parsed
}

exports.getPlatformOverview = async (req, res) => {
  try {
    const [totalColleges, activeColleges, totalDepartments, totalPrincipals, totalHods, totalPlacementOfficers, pendingInvites] = await Promise.all([
      College.countDocuments({}),
      College.countDocuments({ isActive: true }),
      Department.countDocuments({}),
      User.countDocuments({ role: ROLES.PRINCIPAL }),
      User.countDocuments({ role: ROLES.HOD }),
      User.countDocuments({ role: ROLES.PLACEMENT_OFFICER }),
      Invitation.countDocuments({ status: { $in: ["pending", "invited"] } }),
    ])

    return res.status(200).json({
      totalColleges,
      activeColleges,
      totalDepartments,
      totalPrincipals,
      totalHods,
      totalPlacementOfficers,
      pendingInvites,
    })
  } catch (error) {
    logger.error("platform_overview_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(500).json({ message: "Failed to fetch platform overview" })
  }
}

exports.listCollegeDepartmentCapacity = async (req, res) => {
  try {
    const colleges = await College.find({}).sort({ name: 1 }).lean()
    const data = await Promise.all(colleges.map(async (college) => {
      const capacity = await getCollegeDepartmentCapacity(college._id)
      return {
        _id: college._id,
        name: college.name,
        isActive: college.isActive,
        departmentLimit: capacity.departmentLimit,
        departmentCount: capacity.departmentCount,
        remainingDepartmentSlots: capacity.remainingDepartmentSlots,
      }
    }))

    return res.status(200).json(data)
  } catch (error) {
    logger.error("platform_list_college_capacity_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(500).json({ message: "Failed to fetch college department capacity" })
  }
}

exports.updateCollegeDepartmentLimit = async (req, res) => {
  try {
    const { collegeId } = req.params
    const departmentLimit = normalizeDepartmentLimit(req.body?.departmentLimit)

    const capacityBefore = await getCollegeDepartmentCapacity(collegeId)
    if (departmentLimit !== null && capacityBefore.departmentCount > departmentLimit) {
      return res.status(409).json({
        message: "departmentLimit cannot be below current department count",
        departmentCount: capacityBefore.departmentCount,
      })
    }

    const college = await College.findByIdAndUpdate(
      collegeId,
      { $set: { departmentLimit } },
      { new: true },
    ).lean()

    if (!college) return res.status(404).json({ message: "College not found" })

    const capacity = await getCollegeDepartmentCapacity(college._id)
    await logAudit(req.user, "UPDATE_COLLEGE_DEPARTMENT_LIMIT", "College", college._id, req, {
      departmentLimit: capacity.departmentLimit,
      departmentCount: capacity.departmentCount,
    })

    return res.status(200).json({
      _id: college._id,
      name: college.name,
      departmentLimit: capacity.departmentLimit,
      departmentCount: capacity.departmentCount,
      remainingDepartmentSlots: capacity.remainingDepartmentSlots,
    })
  } catch (error) {
    logger.error("platform_update_department_limit_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(error.statusCode || 500).json({ message: error.message || "Failed to update department limit" })
  }
}

exports.listInvitations = async (req, res) => {
  try {
    const status = String(req.query?.status || "").trim()
    const query = {}
    if (status) query.status = status

    const invites = await Invitation.find(query)
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("collegeId", "name")
      .populate("departmentId", "name")
      .lean()

    return res.status(200).json(invites.map((invite) => ({
      _id: invite._id,
      email: invite.email,
      status: invite.status,
      college: invite.collegeId?.name || null,
      department: invite.departmentId?.name || null,
      expiresAt: invite.expiresAt || null,
      acceptedAt: invite.acceptedAt || null,
      revokedAt: invite.revokedAt || null,
      createdAt: invite.createdAt,
    })))
  } catch (error) {
    logger.error("platform_list_invitations_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(500).json({ message: "Failed to fetch invitations" })
  }
}
