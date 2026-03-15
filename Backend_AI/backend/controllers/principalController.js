const Department = require("../models/Department");
const College = require("../models/College")
const User = require("../models/User");
const PlacementDrive = require("../models/PlacementDrive")
const logAudit = require("../utils/auditLogger");
const { ROLES } = require("../constants/roles")
const { logger } = require("../utils/logger")
const { assertDepartmentCapacity, getCollegeDepartmentCapacity } = require("../services/departmentCapacityService")
const { buildPrincipalGraph } = require("../services/principalDataGraphService")
const { LruTtlCache } = require("../utils/cache")

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/**
 * GET /api/principal/student-records
 * Returns a summary list of students for principal view.
 */
exports.getStudentRecords = async (req, res) => {
  try {
    if (!req.user?.collegeId) return res.json([]);
    const collegeFilter = { collegeId: req.user.collegeId }
    const pipeline = [
      { $match: { role: ROLES.STUDENT, ...collegeFilter } },
      {
        $lookup: {
          from: "resumes",
          localField: "_id",
          foreignField: "userId",
          as: "resume"
        }
      },
      { $unwind: { path: "$resume", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          email: 1,
          department: 1,
          batch: 1,
          year: 1,
          cgpa: 1,
          placementStatus: { $ifNull: ["$placementStatus", "available"] },
          rollNo: { $ifNull: ["$rollNo", "N/A"] },
          mobileNumber: { $ifNull: ["$mobileNumber", "N/A"] },
          resumeCompletion: { $ifNull: ["$resume.resumeCompletion", 0] }
        }
      },
      { $sort: { department: 1, name: 1 } }
    ]
    const rows = await User.aggregate(pipeline)
    res.json(rows.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      department: s.department,
      batch: s.batch,
      year: s.year,
      cgpa: s.cgpa,
      placementStatus: s.placementStatus,
      rollNo: s.rollNo,
      phone: s.mobileNumber,
      resumeStatus: (s.resumeCompletion || 0) >= 100 ? "Completed" : "In Progress",
      resumeCompletion: s.resumeCompletion || 0
    })))
  } catch (error) {
    logger.error("principal_get_student_records_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ message: "Failed to fetch student records", error: error.message });
  }
};

/**
 * GET /api/principal/resume-status
 * Returns per-student resume status for principal view.
 * Strict role filter: includes only role "student" in college hierarchy.
 */
exports.getStudentResumeStatus = async (req, res) => {
  try {
    if (!req.user?.collegeId) return res.json([]);
    const match = {
      role: ROLES.STUDENT,
      collegeId: req.user.collegeId,
    };
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "resumes",
          localField: "_id",
          foreignField: "userId",
          as: "resume",
        },
      },
      {
        $unwind: {
          path: "$resume",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: 1,
          department: 1,
          rollNo: 1,
          resumeCompletion: { $ifNull: ["$resume.resumeCompletion", 0] },
          resumeUpdatedAt: { $ifNull: ["$resume.updatedAt", null] },
          resumeStatus: {
            $cond: {
              if: { $gte: ["$resume.resumeCompletion", 100] },
              then: "completed",
              else: {
                $cond: {
                  if: { $gt: ["$resume.resumeCompletion", 0] },
                  then: "in-progress",
                  else: "not-started",
                },
              },
            },
          },
        },
      },
      { $sort: { department: 1, name: 1 } },
    ];
    const rows = await User.aggregate(pipeline);
    const formatted = rows.map((s) => ({
      id: s._id,
      name: s.name,
      rollNo: s.rollNo || "N/A",
      department: s.department || "N/A",
      resumeStatus: s.resumeStatus,
      resumeCompletion: s.resumeCompletion || 0,
      lastUpdated: s.resumeUpdatedAt ? new Date(s.resumeUpdatedAt).toLocaleDateString() : "N/A",
    }));
    res.json(formatted);
  } catch (error) {
    logger.error("principal_get_student_resume_status_failed", { requestId: req.requestId || null, message: error.message });
    res.status(500).json({ message: "Failed to fetch student resume status", error: error.message });
  }
};

/**
 * GET /api/principal/placement-overview
 * Returns placement overview (counts by status, department).
 */
exports.getPlacementOverview = async (req, res) => {
  try {
    if (!req.user?.collegeId) return res.json({ totalStudents: 0, placed: 0, placementRate: 0, byDepartment: [], byStatus: [] });
    const collegeFilter = { collegeId: req.user.collegeId }
    const [byStatus, byDept] = await Promise.all([
      User.aggregate([
        { $match: { role: ROLES.STUDENT, ...collegeFilter } },
        { $group: { _id: "$placementStatus", count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $match: { role: ROLES.STUDENT, ...collegeFilter } },
        { $group: { _id: "$department", total: { $sum: 1 }, placed: { $sum: { $cond: [{ $eq: ["$placementStatus", "placed"] }, 1, 0] } } } }
      ])
    ]);
    const totalStudents = byStatus.reduce((acc, x) => acc + (x.count || 0), 0);
    const placed = byStatus.find((x) => x._id === "placed")?.count || 0;
    res.json({
      totalStudents,
      placed,
      placementRate: totalStudents ? Math.round((placed / totalStudents) * 1000) / 10 : 0,
      byDepartment: byDept.map((d) => ({ department: d._id, total: d.total, placed: d.placed })),
      byStatus: byStatus.map((s) => ({ status: s._id || "unknown", count: s.count }))
    });
  } catch (error) {
    logger.error("principal_get_placement_overview_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ message: "Failed to fetch placement overview", error: error.message });
  }
};

exports.getGrantedAccess = async (req, res) => {
  try {
    if (!req.user?.collegeId) {
      return res.status(200).json([]);
    }

    // Find users created by this principal or in the same college with roles HOD/PO
    const users = await User.find({
      collegeId: req.user.collegeId,
      role: { $in: [ROLES.HOD, ROLES.PLACEMENT_OFFICER] }
    }).select("name email role department status lastLoginAt").lean();

    // Group by role for easier frontend consumption or return flat list
    return res.json(users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department || "N/A",
      status: u.status,
      lastLogin: u.lastLoginAt
    })));
  } catch (error) {
    logger.error("principal_get_granted_access_failed", { message: error.message, requestId: req.requestId || null });
    return res.status(500).json({ message: "Failed to fetch granted access list" });
  }
};

/**
 * GET /api/principal/departments
 * Returns all departments (from Department collection) merged with
 * department stats from User aggregation so principal sees both
 * configured departments and live counts.
 */
exports.getDepartments = async (req, res) => {
  try {
    if (!req.user?.collegeId) {
      return res.json([])
    }

    const list = await Department.find({ collegeId: req.user.collegeId }).sort({ name: 1 }).lean();
    const collegeFilter = req.user?.collegeId ? { collegeId: req.user.collegeId } : {}
    const capacity = await getCollegeDepartmentCapacity(req.user.collegeId)

    const stats = await User.aggregate([
      { $match: { role: ROLES.STUDENT, ...collegeFilter } },
      {
        $group: {
          _id: "$department",
          totalStudents: { $sum: 1 },
          avgCGPA: { $avg: "$cgpa" },
          finalYearStudents: { $sum: { $cond: [{ $eq: ["$year", 4] }, 1, 0] } },
          placedStudents: { $sum: { $cond: [{ $eq: ["$placementStatus", "placed"] }, 1, 0] } }
        }
      }
    ]);
    const openingsByDept = await PlacementDrive.aggregate([
      { $match: { ...collegeFilter, deletedAt: null, status: { $in: ["draft", "open"] } } },
      { $group: { _id: "$eligibility.allowedDepartments", count: { $sum: 1 } } }
    ])
    const openingsLookup = {}
    for (const row of openingsByDept) {
      const departments = Array.isArray(row._id) ? row._id : []
      for (const dept of departments) {
        openingsLookup[dept] = (openingsLookup[dept] || 0) + row.count
      }
    }

    const statsByDept = {};
    stats.forEach((s) => {
      if (s._id) {
        statsByDept[s._id] = {
          totalStudents: s.totalStudents,
          avgCGPA: s.avgCGPA,
          finalYearStudents: s.finalYearStudents,
          placedStudents: s.placedStudents,
        }
      }
    });

    const departments = list.map((d) => ({
      _id: d._id,
      name: d.name,
      hodName: d.hodName || "",
      collegeId: d.collegeId,
      totalStudents: statsByDept[d.name]?.totalStudents ?? 0,
      avgCGPA: statsByDept[d.name]?.avgCGPA ?? 0,
      finalYearStudents: statsByDept[d.name]?.finalYearStudents ?? 0,
      placedStudents: statsByDept[d.name]?.placedStudents ?? 0,
      activeOpenings: openingsLookup[d.name] || 0,
      departmentLimit: capacity.departmentLimit,
      departmentCount: capacity.departmentCount,
      remainingDepartmentSlots: capacity.remainingDepartmentSlots,
      createdAt: d.createdAt
    }));

    res.json(departments);
  } catch (error) {
    logger.error("principal_get_departments_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ message: "Failed to fetch departments", error: error.message });
  }
};

const graphCache = new LruTtlCache({ maxSize: 100, ttlMs: 120000 })
const inflight = new Map()
exports.getPrincipalDataGraph = async (req, res) => {
  try {
    const depthParam = Number(String(req.query.depth || "2"))
    const depth = Number.isNaN(depthParam) ? 2 : Math.max(0, Math.min(depthParam, 5))
    if (!req.user?.collegeId) return res.json({ nodes: [], links: [] })
    const key = `${req.user.collegeId}:depth:${depth}`
    const cached = graphCache.get(key)
    if (cached) return res.json(cached)
    if (inflight.has(key)) {
      const p = inflight.get(key)
      const data = await p
      return res.json(data)
    }
    const promise = buildPrincipalGraph({ collegeId: req.user.collegeId, depth }).then((data) => {
      graphCache.set(key, data)
      inflight.delete(key)
      return data
    }).catch((e) => {
      inflight.delete(key)
      throw e
    })
    inflight.set(key, promise)
    const data = await promise
    res.json(data)
  } catch (error) {
    logger.error("principal_get_data_graph_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ message: "Failed to fetch principal data graph" })
  }
}

/**
 * POST /api/principal/departments
 * Body: { name: string, hodName?: string }
 */
exports.createDepartment = async (req, res) => {
  try {
    const { name, hodName } = req.body || {};
    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      return res.status(400).json({ message: "Department name is required" });
    }

    if (!req.user?.collegeId) {
      await logAudit(req.user, "CREATE_DEPARTMENT_REJECTED", "Department", null, req, {
        reason: "Principal missing college mapping",
      })
      return res.status(400).json({ message: "Principal is missing college mapping" })
    }

    const college = await College.findOne({ _id: req.user.collegeId, isActive: true }).lean()
    if (!college) {
      await logAudit(req.user, "CREATE_DEPARTMENT_REJECTED", "Department", null, req, {
        reason: "Invalid or inactive college",
      })
      return res.status(400).json({ message: "Principal college is not active" })
    }

    try {
      await assertDepartmentCapacity(req.user.collegeId)
    } catch (capacityError) {
      await logAudit(req.user, "CREATE_DEPARTMENT_REJECTED", "Department", null, req, {
        reason: capacityError.code || "DEPARTMENT_LIMIT_REACHED",
        details: capacityError.details || null,
      })
      return res.status(capacityError.statusCode || 409).json({
        message: "Department limit reached. Contact admin.",
        ...(capacityError.details || {}),
      })
    }

    const existing = await Department.findOne({
      collegeId: req.user.collegeId,
      name: { $regex: new RegExp(`^${escapeRegExp(trimmedName)}$`, "i") },
    });
    if (existing) {
      await logAudit(req.user, "CREATE_DEPARTMENT_REJECTED", "Department", existing._id, req, {
        reason: "Duplicate department name",
      })
      return res.status(400).json({ message: "Department with this name already exists" });
    }

    const department = new Department({
      name: trimmedName,
      collegeId: req.user.collegeId,
      hodName: typeof hodName === "string" ? hodName.trim() : "",
      createdBy: req.user?._id || null
    });
    await department.save();

    const capacity = await getCollegeDepartmentCapacity(req.user.collegeId)

    await logAudit(req.user, "CREATE_DEPARTMENT", "Department", department._id, req, {
      departmentName: department.name,
      collegeId: department.collegeId,
      departmentCount: capacity.departmentCount,
      departmentLimit: capacity.departmentLimit,
    });

    res.status(201).json({
      _id: department._id,
      name: department.name,
      hodName: department.hodName || "",
      collegeId: department.collegeId,
      departmentLimit: capacity.departmentLimit,
      departmentCount: capacity.departmentCount,
      remainingDepartmentSlots: capacity.remainingDepartmentSlots,
      createdAt: department.createdAt
    });
  } catch (error) {
    await logAudit(req.user, "CREATE_DEPARTMENT_REJECTED", "Department", null, req, {
      reason: error.code || "INTERNAL_ERROR",
      message: error.message,
    })
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Department with this name already exists for this college" })
    }
    logger.error("principal_create_department_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ message: "Failed to create department", error: error.message });
  }
};

/**
 * GET /api/principal/audit-logs
 * Returns audit logs scoped to the principal's college.
 */
exports.getAuditLogs = async (req, res) => {
  try {
    if (!req.user?.collegeId) {
      return res.status(200).json([]);
    }

    const AuditLog = require("../models/AuditLog");

    // Get all users and departments belonging to this college
    const usersInCollege = await User.find({ collegeId: req.user.collegeId }).select("_id").lean();
    const deptsInCollege = await Department.find({ collegeId: req.user.collegeId }).select("_id").lean();

    const userIds = usersInCollege.map((u) => String(u._id));
    const deptIds = deptsInCollege.map((d) => String(d._id));

    // A log is relevant if the actor (userId) is the principal OR any user in the college
    // OR if the entity affected (entityId) is a user or department in the college.
    // Also include the college itself.
    const relevantIds = [String(req.user._id), String(req.user.collegeId), ...userIds, ...deptIds];

    const limit = Math.min(Number(req.query?.limit) || 50, 100);

    const logs = await AuditLog.find({
      $or: [
        { userId: { $in: relevantIds } },
        { entityId: { $in: relevantIds } }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("userId", "name email role")
      .lean();

    return res.status(200).json(logs);
  } catch (error) {
    logger.error("principal_audit_logs_failed", { message: error.message, requestId: req.requestId || null });
    return res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};

/**
 * GET /api/principal/profile
 * Returns principal profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password_hash");
    res.json({
      fullName: user.name,
      email: user.email,
      phone: user.mobileNumber,
      alternateEmail: user.alternateEmail,
      emergencyContact: user.emergencyContact,
      department: user.department,
      designation: user.designation,
      employeeId: user.employeeId,
      tenure: user.tenure,
      office: user.office,
      officeHours: user.officeHours,
      location: user.location,
      qualifications: user.qualifications,
      achievements: user.achievements,
      bio: user.bio
    });
  } catch (error) {
    logger.error("principal_profile_fetch_failed", { requestId: req.requestId || null, message: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/principal/profile
 * Updates principal profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.fullName) updateData.name = req.body.fullName;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.phone) updateData.mobileNumber = req.body.phone;

    ["alternateEmail", "emergencyContact", "department", "designation",
      "employeeId", "tenure", "office", "officeHours", "qualifications",
      "achievements", "bio", "location"].forEach(f => {
        if (req.body[f] !== undefined) updateData[f] = req.body[f];
      });

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });

    res.json({
      fullName: user.name,
      email: user.email,
      phone: user.mobileNumber,
      alternateEmail: user.alternateEmail,
      emergencyContact: user.emergencyContact,
      department: user.department,
      designation: user.designation,
      employeeId: user.employeeId,
      tenure: user.tenure,
      office: user.office,
      officeHours: user.officeHours,
      location: user.location,
      qualifications: user.qualifications,
      achievements: user.achievements,
      bio: user.bio
    });
  } catch (error) {
    logger.error("principal_profile_update_failed", { requestId: req.requestId || null, message: error.message });
    res.status(500).json({ error: error.message });
  }
};
