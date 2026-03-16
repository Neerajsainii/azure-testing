const User = require("../models/User");
const College = require("../models/College")
const Department = require("../models/Department")
const AuditLog = require("../models/AuditLog")
const SystemSettings = require("../models/SystemSettings")
const XLSX = require("xlsx");
const archiver = require("archiver");
const logAudit = require("../utils/auditLogger");
const DownloadUsage = require("../models/DownloadUsage");
const { ROLES } = require("../constants/roles")
const { env } = require("../config/env")
const { getCollegeDepartmentCapacity } = require("../services/departmentCapacityService")
const { logger } = require("../utils/logger")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const sendEmail = require("../utils/sendEmail")

const ContactQuery = require("../models/ContactQuery")

const JOB_READY_THRESHOLD = 70;

const normalizeDepartmentLimit = (value) => {
  if (value === undefined) return undefined
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

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

exports.adminDashboard = async (req, res) => {
  try {
    await logAudit(req.user, "VIEW_ADMIN_DASHBOARD", "Dashboard", null, req);
    const [totalUsers, totalColleges, activeColleges, recentLogs] = await Promise.all([
      User.countDocuments({ role: ROLES.STUDENT }),
      College.countDocuments({}),
      College.countDocuments({ isActive: true }),
      AuditLog.find({}).sort({ timestamp: -1 }).limit(10).populate("userId", "name").lean(),
    ])
    return res.status(200).json({
      totalUsers,
      totalColleges,
      systemHealth: "Good",
      activeSessions: 0,
      recentAuditLogs: recentLogs.map((log) => ({
        id: log._id,
        action: log.action,
        entityType: log.entityType,
        admin: log.userId?.name || log.role || "System",
        details: log.metadata?.collegeName || log.action,
        timestamp: log.timestamp,
      })),
    })
  } catch (error) {
    logger.error("admin_dashboard_failed", { message: error.message, requestId: req.requestId || null })
    return res.status(500).json({ message: "Failed to fetch dashboard" })
  }
}

exports.listAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query?.limit) || 50, 100)
    const logs = await AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("userId", "name email")
      .lean()
    return res.status(200).json(logs)
  } catch (error) {
    logger.error("admin_audit_logs_failed", { message: error.message, requestId: req.requestId || null })
    return res.status(500).json({ message: "Failed to fetch audit logs" })
  }
}

exports.listColleges = async (req, res) => {
  try {
    const includeInactive = String(req.query?.includeInactive || "false").toLowerCase() === "true"
    const collegeFilter = includeInactive ? {} : { isActive: true }

    const [colleges, departmentCounts, studentCounts, principalRows] = await Promise.all([
      College.find(collegeFilter).sort({ name: 1 }).lean(),
      Department.aggregate([
        { $match: {} },
        { $group: { _id: "$collegeId", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: ROLES.STUDENT, collegeId: { $ne: null } } },
        { $group: { _id: "$collegeId", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: ROLES.PRINCIPAL, collegeId: { $ne: null } } },
        { $sort: { updatedAt: -1 } },
        {
          $group: {
            _id: "$collegeId",
            principalName: { $first: "$name" },
          },
        },
      ]),
    ])

    const deptMap = Object.fromEntries(
      departmentCounts.map((row) => [String(row._id), row.count])
    )
    const studentMap = Object.fromEntries(
      studentCounts.map((row) => [String(row._id), row.count])
    )
    const principalMap = Object.fromEntries(
      principalRows.map((row) => [String(row._id), row.principalName])
    )

    const data = colleges.map((college) => {
      const collegeId = String(college._id)
      const departmentCount = Number(deptMap[collegeId] || 0)
      const departmentLimit = college.departmentLimit ?? null
      return {
        _id: college._id,
        name: college.name,
        departmentLimit,
        departmentCount,
        remainingDepartmentSlots: departmentLimit === null
          ? null
          : Math.max(departmentLimit - departmentCount, 0),
        studentCount: Number(studentMap[collegeId] || 0),
        principalName: principalMap[collegeId] || "Unassigned",
        status: college.isActive ? "active" : "inactive",
        createdAt: college.createdAt,
        updatedAt: college.updatedAt,
      }
    })

    res.status(200).json(data)
  } catch (error) {
    logger.error("admin_list_colleges_failed", { message: error.message, requestId: req.requestId || null })
    res.status(500).json({ message: "Failed to fetch colleges" })
  }
}

exports.createCollege = async (req, res) => {
  try {
    const mongoose = require("mongoose")
    if (mongoose.connection.readyState !== 1) {
      const msg = "Database is not connected. Please try again later."
      logger.error("db_not_connected_on_create_college", { requestId: req.requestId || null })
      return res.status(503).json({ message: msg, code: "DB_UNAVAILABLE" })
    }
    const name = String(req.body?.name || "").trim()
    if (!name) return res.status(400).json({ message: "College name is required" })

    const departmentLimit = normalizeDepartmentLimit(req.body?.departmentLimit)
    const existing = await College.findOne({ name: { $regex: new RegExp(`^${escapeRegExp(name)}$`, "i") } }).lean()
    if (existing) {
      return res.status(409).json({ message: "College with this name already exists" })
    }

    const college = await College.create({
      name,
      createdBy: req.user?._id || null,
      departmentLimit: departmentLimit === undefined ? env.defaultCollegeDepartmentLimit : departmentLimit,
    })

    await logAudit(req.user, "CREATE_COLLEGE", "College", college._id, req, {
      collegeName: college.name,
      departmentLimit: college.departmentLimit,
    })

    return res.status(201).json({
      _id: college._id,
      name: college.name,
      departmentLimit: college.departmentLimit ?? null,
      status: college.isActive ? "active" : "inactive",
      createdAt: college.createdAt,
    })
  } catch (error) {
    logger.error("admin_create_college_failed", { message: error.message, requestId: req.requestId || null })
    return res.status(error.statusCode || 500).json({ message: error.message || "Failed to create college" })
  }
}

exports.updateCollege = async (req, res) => {
  try {
    const { id } = req.params
    const updates = {}

    if (req.body?.name !== undefined) {
      const name = String(req.body.name || "").trim()
      if (!name) return res.status(400).json({ message: "College name cannot be empty" })
      updates.name = name
    }

    if (req.body?.status !== undefined) {
      const status = String(req.body.status).toLowerCase()
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" })
      }
      updates.isActive = status === "active"
    }

    const departmentLimit = normalizeDepartmentLimit(req.body?.departmentLimit)
    if (departmentLimit !== undefined) {
      const capacity = await getCollegeDepartmentCapacity(id)
      if (departmentLimit !== null && capacity.departmentCount > departmentLimit) {
        return res.status(409).json({
          message: "departmentLimit cannot be below current department count",
          departmentCount: capacity.departmentCount,
        })
      }
      updates.departmentLimit = departmentLimit
    }

    const college = await College.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean()
    if (!college) return res.status(404).json({ message: "College not found" })

    const capacity = await getCollegeDepartmentCapacity(college._id)

    await logAudit(req.user, "UPDATE_COLLEGE", "College", college._id, req, {
      updates: Object.keys(updates),
      departmentLimit: college.departmentLimit ?? null,
      departmentCount: capacity.departmentCount,
    })

    return res.status(200).json({
      _id: college._id,
      name: college.name,
      status: college.isActive ? "active" : "inactive",
      departmentLimit: capacity.departmentLimit,
      departmentCount: capacity.departmentCount,
      remainingDepartmentSlots: capacity.remainingDepartmentSlots,
      updatedAt: college.updatedAt,
    })
  } catch (error) {
    logger.error("admin_update_college_failed", { message: error.message, requestId: req.requestId || null })
    return res.status(error.statusCode || 500).json({ message: error.message || "Failed to update college" })
  }
}

exports.deleteCollege = async (req, res) => {
  try {
    const { id } = req.params
    const college = await College.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean()
    if (!college) return res.status(404).json({ message: "College not found" })

    await logAudit(req.user, "DEACTIVATE_COLLEGE", "College", college._id, req, {
      collegeName: college.name,
    })

    return res.status(200).json({ message: "College deactivated successfully" })
  } catch (error) {
    logger.error("admin_delete_college_failed", { message: error.message, requestId: req.requestId || null })
    return res.status(500).json({ message: "Failed to deactivate college" })
  }
}

exports.getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne().lean();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    return res.status(200).json(settings);
  } catch (error) {
    logger.error("admin_get_settings_failed", { message: error.message, requestId: req.requestId || null });
    return res.status(500).json({ message: "Failed to fetch settings" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, collegeId, status } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof name === "string") user.name = name;
    if (typeof role === "string") {
      const v = String(role || "").toUpperCase();
      if (v === "PRINCIPAL") user.role = ROLES.PRINCIPAL;
      else if (v === "STUDENT") user.role = ROLES.STUDENT;
      else if (v === "PLACEMENT" || v === "PLACEMENT_OFFICER") user.role = ROLES.PLACEMENT_OFFICER;
      else if (v === "HOD") user.role = ROLES.HOD;
    }

    if (collegeId) {
      const College = require("../models/College");
      const foundCollege = await College.findById(collegeId);
      if (foundCollege) {
        user.collegeId = foundCollege._id;
        user.collegeName = foundCollege.name;
      }
    } else if (collegeId === null || collegeId === "") {
      user.collegeId = null;
      user.collegeName = null;
    }

    if (typeof status === "string") {
      user.status = String(status).toLowerCase() === "inactive" ? "suspended" : "active";
    }

    await user.save();
    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId,
      college: user.collegeName || "N/A",
      status: user.status || "active",
    });
  } catch (error) {
    logger.error("update_user_error", { error: error.message });
    return res.status(500).json({ message: "Failed to update user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const result = await User.deleteOne({ _id: id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" })
    }
    return res.status(200).json({ message: "User deleted" })
  } catch (error) {
    logger.error("delete_user_error", { error: error.message })
    return res.status(500).json({ message: "Failed to delete user" })
  }
}

exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    const settings = await SystemSettings.findOneAndUpdate(
      {},
      { $set: { ...updates, updatedBy: req.user._id } },
      { upsert: true, new: true }
    );

    await logAudit(req.user, "UPDATE_SYSTEM_SETTINGS", "Settings", settings._id, req, {
      updates: Object.keys(updates)
    });

    return res.status(200).json(settings);
  } catch (error) {
    logger.error("admin_update_settings_failed", { message: error.message, requestId: req.requestId || null });
    return res.status(500).json({ message: "Failed to update settings" });
  }
};

exports.listContactQueries = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query?.limit) || 50, 100)
    const page = Math.max(Number(req.query?.page) || 1, 1)
    const status = req.query?.status

    const filter = {}
    if (status) filter.status = status

    const [queries, total] = await Promise.all([
      ContactQuery.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContactQuery.countDocuments(filter)
    ])

    return res.status(200).json({
      queries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    logger.error("admin_list_contact_queries_failed", { message: error.message })
    return res.status(500).json({ message: "Failed to fetch contact queries" })
  }
}

const getFilteredStudents = async (query, actor) => {
  const {
    department,
    batch,
    year,
    status,
    resumeCompleted,
    atsScoreMin,
    atsScoreMax,
    jobReady,
    skills,
    section,
    attendanceMin,
    backlogsMax,
    cgpaSort,
    percentageSort,
    backlogsSort,
  } = query;

  const match = {};

  // This endpoint is student-only regardless of caller.
  match.role = ROLES.STUDENT;

  // Enforce role-based data scope on the backend.
  if (actor?.collegeId && [ROLES.PRINCIPAL, ROLES.PLACEMENT_OFFICER, ROLES.HOD].includes(actor.role)) {
    match.collegeId = actor.collegeId
  }

  if (department) {
    const departmentValues = String(department)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (departmentValues.length === 1) {
      match.department = departmentValues[0];
    } else if (departmentValues.length > 1) {
      match.department = { $in: departmentValues };
    }
  }

  // HOD scope cannot be widened by query filters.
  if (actor?.role === ROLES.HOD && actor.department) {
    match.department = actor.department
  }

  if (batch) {
    const batchValues = String(batch)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (batchValues.length === 1) {
      match.batch = batchValues[0];
    } else if (batchValues.length > 1) {
      match.batch = { $in: batchValues };
    }
  }

  if (year) {
    const yearNumber = Number(year);
    if (!Number.isNaN(yearNumber)) {
      match.year = yearNumber;
    }
  }

  if (status) {
    const statusValues = String(status)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (statusValues.length === 1) {
      match.status = statusValues[0];
    } else if (statusValues.length > 1) {
      match.status = { $in: statusValues };
    }
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "resumes",
        localField: "_id",
        foreignField: "userId",
        as: "resume"
      }
    },
    {
      $unwind: {
        path: "$resume",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "studentacademicprofiles",
        localField: "_id",
        foreignField: "userId",
        as: "academicProfile"
      }
    },
    {
      $unwind: {
        path: "$academicProfile",
        preserveNullAndEmptyArrays: true
      }
    }
  ];

  if (typeof resumeCompleted === "string") {
    if (resumeCompleted === "true") {
      pipeline.push({
        $match: {
          "resume.resumeCompletion": { $gte: 100 }
        }
      });
    } else if (resumeCompleted === "false") {
      pipeline.push({
        $match: {
          $or: [
            { "resume.resumeCompletion": { $lt: 100 } },
            { "resume.resumeCompletion": { $exists: false } }
          ]
        }
      });
    }
  }

  const atsFilter = {};

  if (typeof atsScoreMin === "string") {
    const minValue = Number(atsScoreMin);
    if (!Number.isNaN(minValue)) {
      atsFilter.$gte = minValue;
    }
  }

  if (typeof atsScoreMax === "string") {
    const maxValue = Number(atsScoreMax);
    if (!Number.isNaN(maxValue)) {
      atsFilter.$lte = maxValue;
    }
  }

  if (Object.keys(atsFilter).length > 0) {
    pipeline.push({
      $match: {
        "resume.atsScore": atsFilter
      }
    });
  }

  if (typeof jobReady === "string") {
    if (jobReady === "true") {
      pipeline.push({
        $match: {
          "resume.jobMatchScore": { $gte: JOB_READY_THRESHOLD }
        }
      });
    } else if (jobReady === "false") {
      pipeline.push({
        $match: {
          $or: [
            { "resume.jobMatchScore": { $lt: JOB_READY_THRESHOLD } },
            { "resume.jobMatchScore": { $exists: false } }
          ]
        }
      });
    }
  }

  if (typeof skills === "string" && skills.trim().length > 0) {
    const skillValues = skills
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (skillValues.length > 0) {
      pipeline.push({
        $match: {
          "resume.skills": { $all: skillValues }
        }
      });
    }
  }
  if (section) {
    pipeline.push({ $match: { "academicProfile.section": String(section).trim() } })
  }
  if (attendanceMin !== undefined && attendanceMin !== "") {
    const min = Number(attendanceMin)
    if (!Number.isNaN(min)) {
      pipeline.push({ $match: { "academicProfile.attendancePercent": { $gte: min } } })
    }
  }
  if (backlogsMax !== undefined && backlogsMax !== "") {
    const max = Number(backlogsMax)
    if (!Number.isNaN(max)) {
      pipeline.push({ $match: { "academicProfile.backlogsCount": { $lte: max } } })
    }
  }

  pipeline.push({
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      mobileNumber: 1,
      department: 1,
      batch: 1,
      year: 1,
      cgpa: 1,
      status: 1,
      placementStatus: 1,
      rollNo: 1,
      section: { $ifNull: ["$academicProfile.section", ""] },
      percentage12: { $ifNull: ["$academicProfile.percentage12", 0] },
      backlogsCount: { $ifNull: ["$academicProfile.backlogsCount", 0] },
      attendancePercent: { $ifNull: ["$academicProfile.attendancePercent", 0] },
      resumeCompletion: {
        $ifNull: ["$resume.resumeCompletion", 0]
      },
      atsScore: {
        $ifNull: ["$resume.atsScore", 0]
      },
      jobMatchScore: {
        $ifNull: ["$resume.jobMatchScore", 0]
      },
      lastAIScoredAt: "$resume.lastAIScoredAt",
      skills: {
        $ifNull: ["$resume.skills", []]
      }
    }
  });
  const sort = {}
  if (cgpaSort === "asc" || cgpaSort === "desc") sort.cgpa = cgpaSort === "asc" ? 1 : -1
  if (percentageSort === "asc" || percentageSort === "desc") sort.percentage12 = percentageSort === "asc" ? 1 : -1
  if (backlogsSort === "asc" || backlogsSort === "desc") sort.backlogsCount = backlogsSort === "asc" ? 1 : -1
  if (Object.keys(sort).length > 0) {
    pipeline.push({ $sort: sort })
  }

  const results = await User.aggregate(pipeline);

  const students = results.map((doc) => {
    const resumeCompletionValue = doc.resumeCompletion || 0;
    const jobMatchScoreValue = doc.jobMatchScore || 0;

    return {
      studentId: doc._id,
      name: doc.name,
      email: doc.email,
      phone: doc.mobileNumber || null,
      department: doc.department,
      batch: doc.batch,
      year: doc.year,
      cgpa: doc.cgpa || 0,
      status: doc.status,
      placementStatus: doc.placementStatus || "available",
      rollNo: doc.rollNo || null,
      section: doc.section || null,
      percentage12: doc.percentage12 || 0,
      backlogsCount: doc.backlogsCount || 0,
      attendancePercent: doc.attendancePercent || 0,
      profileCompleted: resumeCompletionValue >= 100,
      resumeCompletion: resumeCompletionValue,
      atsScore: doc.atsScore || 0,
      jobMatchScore: jobMatchScoreValue,
      jobReady: jobMatchScoreValue >= JOB_READY_THRESHOLD,
      lastAIScoredAt: doc.lastAIScoredAt || null,
      skills: doc.skills || []
    };
  });

  return students;
};

exports.listStudents = async (req, res) => {
  try {
    const students = await getFilteredStudents(req.query, req.user);

    res.status(200).json({
      count: students.length,
      students
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const buildCsvValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  const mustQuote =
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r");

  if (!mustQuote) {
    return stringValue;
  }

  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
};

const generateCsvFromStudents = (students) => {
  const headers = [
    "name",
    "email",
    "department",
    "batch",
    "year",
    "status",
    "resumeCompletion",
    "atsScore",
    "jobMatchScore",
    "jobReady"
  ];

  const rows = [headers.join(",")];

  students.forEach((student) => {
    const values = [
      buildCsvValue(student.name),
      buildCsvValue(student.email),
      buildCsvValue(student.department),
      buildCsvValue(student.batch),
      buildCsvValue(student.year),
      buildCsvValue(student.status),
      buildCsvValue(student.resumeCompletion),
      buildCsvValue(student.atsScore),
      buildCsvValue(student.jobMatchScore),
      buildCsvValue(student.jobReady)
    ];

    rows.push(values.join(","));
  });

  return rows.join("\n");
};

const generateExcelBufferFromStudents = (students) => {
  const data = students.map((student) => ({
    name: student.name,
    email: student.email,
    department: student.department,
    batch: student.batch,
    year: student.year,
    status: student.status,
    resumeCompletion: student.resumeCompletion,
    atsScore: student.atsScore,
    jobMatchScore: student.jobMatchScore,
    jobReady: student.jobReady
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx"
  });
};

exports.exportStudentsZip = async (req, res, next) => {
  try {
    const students = await getFilteredStudents(req.query, req.user);

    const csvContent = generateCsvFromStudents(students);
    const excelBuffer = generateExcelBufferFromStudents(students);

    const timestamp = Date.now();

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="students-export-${timestamp}.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      next(err);
    });

    archive.on("end", () => {
      if (req.user) {
        logAudit(req.user, "EXPORT_STUDENTS_ZIP", "export", null, req);
      }

      if (req.user && req.user.role === ROLES.PLACEMENT_OFFICER) {
        const month =
          typeof req.downloadMonth === "string" && req.downloadMonth.length > 0
            ? req.downloadMonth
            : (() => {
              const now = new Date();
              const year = now.getFullYear();
              const m = String(now.getMonth() + 1).padStart(2, "0");
              return `${year}-${m}`;
            })();

        DownloadUsage.findOneAndUpdate(
          { userId: req.user._id, month },
          {
            $inc: { count: 1 },
            $setOnInsert: { userId: req.user._id, month }
          },
          { upsert: true, new: true }
        ).catch(() => { });
      }
    });

    archive.pipe(res);

    archive.append(csvContent, { name: "students.csv" });
    archive.append(excelBuffer, { name: "students.xlsx" });

    archive.finalize();
  } catch (error) {
    next(error);
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { role, search, sortBy, order } = req.query;
    const query = {};

    if (role && role !== "all") {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const sort = (() => {
      const dir = String(order || "desc").toLowerCase() === "asc" ? 1 : -1
      switch (String(sortBy || "").toLowerCase()) {
        case "role": return { role: dir }
        case "name": return { name: dir }
        case "email": return { email: dir }
        case "createdat": return { createdAt: dir }
        default: return { createdAt: -1 }
      }
    })()

    const users = await User.find(query)
      .select("name email role collegeId collegeName status createdAt")
      .sort(sort);

    const formattedUsers = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId || null,
      college: user.collegeName || "N/A",
      status: user.status || "active",
    }));

    res.status(200).json({ users: formattedUsers });
  } catch (error) {
    logger.error("list_users_error", { error: error.message });
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, role, collegeId, status } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const roleValue = (() => {
      const v = String(role || "").toUpperCase();
      if (v === "PRINCIPAL") return ROLES.PRINCIPAL;
      if (v === "STUDENT") return ROLES.STUDENT;
      if (v === "PLACEMENT" || v === "PLACEMENT_OFFICER") return ROLES.PLACEMENT_OFFICER;
      if (v === "HOD") return ROLES.HOD;
      return ROLES.STUDENT;
    })();

    let collegeIdFound = null;
    let collegeNameFound = null;
    if (collegeId) {
      const College = require("../models/College");
      const foundCollege = await College.findById(collegeId);
      if (foundCollege) {
        collegeIdFound = foundCollege._id;
        collegeNameFound = foundCollege.name;
      } else {
        return res.status(400).json({ message: "Provided college not found." });
      }
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenExpiry = new Date(Date.now() + (env.inviteExpiryHours || 168) * 60 * 60 * 1000);

    const newUser = new User({
      name,
      email,
      role: roleValue,
      collegeName: collegeNameFound,
      collegeId: collegeIdFound,
      status: String(status || "").toLowerCase() === "inactive" ? "suspended" : "active",
      password_hash: null,
      accountStatus: "INVITED",
      isEmailVerified: false,
      invitedBy: req.user?._id || null,
      inviteToken,
      inviteTokenExpiry,
    });

    await newUser.save();

    const activationLink = `${env.frontendUrl}/register?token=${inviteToken}&email=${encodeURIComponent(email)}`

    let emailSent = true;
    try {
      await sendEmail(
        email,
        "Activate Your Platform Account",
        `You have been invited to join the platform as a ${roleValue}.\n\nPlease activate your account and set your password by clicking the link below:\n${activationLink}\n\nThis link will expire in ${env.inviteExpiryHours || 168} hours.`
      )
    } catch (emailError) {
      logger.error("create_user_email_failed", { error: emailError.message });
      emailSent = false;
    }

    await logAudit(req.user, "ADMIN_CREATED_USER", "User", newUser._id, req, {
      email,
      role: roleValue,
    })

    res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      college: newUser.collegeName,
      status: newUser.status,
      warning: emailSent ? undefined : "User created, but failed to send activation email."
    });
  } catch (error) {
    logger.error("create_user_error", { error: error.message });
    res.status(500).json({ message: "Failed to create user" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const email = req.user.email;
    const AdminProfile = require("../models/AdminProfile");

    let profile = await AdminProfile.findOne({ email }).lean();
    if (!profile) {
      profile = {
        email: email,
        name: req.user.name || "Admin"
      };
    }

    // Merge login history from the base Admin model if it exists
    if (req.user.loginHistory) {
      profile.loginHistory = req.user.loginHistory;
    }

    res.status(200).json(profile);
  } catch (error) {
    const { logger } = require("../utils/logger");
    logger.error("get_admin_profile_error", { error: error.message });
    res.status(500).json({ message: "Failed to fetch admin profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const email = req.user.email;
    const AdminProfile = require("../models/AdminProfile");

    // Only update fields that exist in the form data
    const updateData = {};
    const allowedFields = [
      "name", "phone", "alternateEmail", "emergencyContact",
      "designation", "employeeId", "tenure", "department",
      "office", "officeHours", "location", "permissions",
      "achievements", "bio"
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // if email is being updated, store it (but email is the unique identifier, maybe don't allow changing it from here easily, or check if it's the same)
    if (req.body.email && req.body.email !== email) {
      // Typically, changing core email requires special flow, but we can update the profile email if needed. 
      // For this task, we'll keep the profile tied to req.user.email
    }

    const profile = await AdminProfile.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true, upsert: true }
    ).lean();

    res.status(200).json(profile);
  } catch (error) {
    const { logger } = require("../utils/logger");
    logger.error("update_admin_profile_error", { error: error.message });
    res.status(500).json({ message: "Failed to update admin profile" });
  }
};

