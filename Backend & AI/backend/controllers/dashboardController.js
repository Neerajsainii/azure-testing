const User = require("../models/User");
const Resume = require("../models/Resume");
const AuditLog = require("../models/AuditLog");
const Approval = require("../models/Approval");
const Company = require("../models/Company");
const Department = require("../models/Department")
const PlacementDrive = require("../models/PlacementDrive")
const { ROLES } = require("../constants/roles")
const { logger } = require("../utils/logger")
const { getCollegeDepartmentCapacity } = require("../services/departmentCapacityService")

/* ================= STUDENT DASHBOARD ================= */
exports.studentDashboard = async (req, res) => {
  const resume = await Resume.findOne({ userId: req.user.id });

  res.json({
    resumeStatus: resume ? "Completed" : "Pending",
    resumeCompletion: resume?.resumeCompletion || 0,
    atsScore: resume?.atsScore || 0,
    lastUpdated: resume?.updatedAt || null
  });
};

/* ================= HOD DASHBOARD ================= */
exports.hodDashboard = async (req, res) => {
  const { year, sortBy = "name", order = "asc" } = req.query;

  const deptRaw = String(req.user.department || "").trim()
  const deptRegex = deptRaw
    ? new RegExp(`^${deptRaw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
    : null

  let filter = {
    role: ROLES.STUDENT,
    ...(deptRegex ? { department: deptRegex } : {}),
    ...(req.user.collegeId ? { collegeId: req.user.collegeId } : {}),
  };

  if (year) filter.year = Number(year);

  let sort = {};
  sort[sortBy] = order === "desc" ? -1 : 1;

  const students = await User.find(filter)
    .select("name year cgpa")
    .sort(sort);

  // Get recent activities for these students
  const studentIds = students.map(s => s._id);
  const recentLogs = await AuditLog.find({ userId: { $in: studentIds } })
    .sort({ timestamp: -1 })
    .limit(5)
    .populate("userId", "name department");

  const recentActivities = recentLogs.map(log => ({
    id: log._id,
    student: log.userId ? log.userId.name : "Unknown",
    action: log.action,
    department: log.userId ? log.userId.department : req.user.department,
    timestamp: new Date(log.timestamp).toLocaleDateString(),
    status: "Completed"
  }));

  res.json({
    department: req.user.department,
    totalStudents: students.length,
    students,
    recentActivities
  });
};

/* ================= HOD STUDENTS LIST ================= */
exports.getHodStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      department,
      placementStatus,
      resumeStatus,
      year,
      section,
      attendanceMin,
      skills,
      cgpaSort,
      percentageSort,
      backlogsSort,
    } = req.query;

    const deptRaw = String(req.user.department || "").trim()
    const deptRegex = deptRaw
      ? new RegExp(`^${deptRaw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
      : null

    let match = {
      role: ROLES.STUDENT,
      ...(deptRegex ? { department: deptRegex } : {}),
      ...(req.user.collegeId ? { collegeId: req.user.collegeId } : {}),
    };

    if (search) {
      match.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (department && department !== 'all') {
      const deptParam = String(department).trim()
      const deptParamRegex = new RegExp(`^${deptParam.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
      match.department = deptParamRegex
    }
    if (year && year !== "all") {
      const yearNum = Number(year)
      if (!Number.isNaN(yearNum)) match.year = yearNum
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
      },
      {
        $project: {
          name: 1,
          rollNo: 1,
          email: 1,
          department: 1,
          year: 1,
          cgpa: 1,
          mobileNumber: 1,
          placementStatus: 1,
          section: { $ifNull: ["$academicProfile.section", ""] },
          attendancePercent: { $ifNull: ["$academicProfile.attendancePercent", 0] },
          backlogsCount: { $ifNull: ["$academicProfile.backlogsCount", 0] },
          percentage12: { $ifNull: ["$academicProfile.percentage12", 0] },
          profileSkills: { $ifNull: ["$academicProfile.skills", []] },
          resumeSkills: { $ifNull: ["$resume.skills", []] },
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
                  else: "not-started"
                }
              }
            }
          }
        }
      }
    ];

    if (resumeStatus && resumeStatus !== 'all') {
      pipeline.push({ $match: { resumeStatus } });
    }

    if (placementStatus && placementStatus !== 'all') {
      pipeline.push({ $match: { placementStatus } });
    }
    if (section && section !== "all") {
      pipeline.push({ $match: { section } })
    }
    if (attendanceMin !== undefined && attendanceMin !== "") {
      const min = Number(attendanceMin)
      if (!Number.isNaN(min)) pipeline.push({ $match: { attendancePercent: { $gte: min } } })
    }
    if (skills && String(skills).trim()) {
      const required = String(skills).split(",").map((s) => s.trim()).filter(Boolean)
      if (required.length > 0) {
        pipeline.push({
          $addFields: {
            mergedSkills: { $setUnion: ["$profileSkills", "$resumeSkills"] }
          }
        })
        pipeline.push({ $match: { mergedSkills: { $all: required } } })
      }
    }

    const sort = {}
    if (cgpaSort === "asc" || cgpaSort === "desc") sort.cgpa = cgpaSort === "asc" ? 1 : -1
    if (percentageSort === "asc" || percentageSort === "desc") sort.percentage12 = percentageSort === "asc" ? 1 : -1
    if (backlogsSort === "asc" || backlogsSort === "desc") sort.backlogsCount = backlogsSort === "asc" ? 1 : -1
    if (Object.keys(sort).length === 0) sort.name = 1
    pipeline.push({ $sort: sort })

    pipeline.push({ $skip: (Number(page) - 1) * Number(limit) });
    pipeline.push({ $limit: Number(limit) });

    const students = await User.aggregate(pipeline);
    const formattedUsers = students.map(s => ({
      id: s._id,
      name: s.name,
      rollNo: s.rollNo || "N/A",
      email: s.email,
      phone: s.mobileNumber || "N/A",
      department: s.department,
      cgpa: s.cgpa || 0,
      year: s.year ? `${s.year}th Year` : "N/A",
      section: s.section || "N/A",
      attendancePercent: s.attendancePercent || 0,
      percentage12: s.percentage12 || 0,
      backlogsCount: s.backlogsCount || 0,
      resumeStatus: s.resumeStatus,
      placementStatus: s.placementStatus || "available",
      resumeCompletion: s.resumeCompletion,
      lastUpdated: s.resumeUpdatedAt ? new Date(s.resumeUpdatedAt).toLocaleDateString() : "N/A"
    }));

    // For HOD, also fetch matching Invitations that haven't been accepted yet
    const Invitation = require("../models/Invitation");
    const inviteMatch = {
      status: { $in: ["pending", "invited"] },
      invitedByHodId: req.user._id,
    };
    if (search) {
      inviteMatch.$or = [{ email: { $regex: search, $options: "i" } }];
      if (typeof search === "string" && search.includes("@") === false) {
        // If we stored name in invite metadata we could search it, but email is safer
      }
    }
    // Only include invitations if they don't break strict filters like cgpa or resume status
    let formattedInvites = [];
    if (!resumeStatus || resumeStatus === "all") {
      const invites = await Invitation.find(inviteMatch).lean();
      formattedInvites = invites.map(inv => ({
        id: inv._id,
        name: inv.meta?.name || inv.email.split("@")[0],
        rollNo: inv.meta?.rollNo || "N/A",
        email: inv.email,
        phone: "N/A",
        department: req.user.department,
        cgpa: 0,
        year: inv.meta?.year ? `${inv.meta.year}th Year` : "N/A",
        section: "N/A",
        attendancePercent: 0,
        percentage12: 0,
        backlogsCount: 0,
        resumeStatus: "not-started",
        placementStatus: "available",
        resumeCompletion: 0,
        lastUpdated: "N/A"
      }));
    }

    // Combine and apply limit/skip over the combined dataset if needed
    // However, since we applied aggregation skip/limit above, adding invites here 
    // will append them to the current page. To do it correctly across pages requires 
    // complex unions, but appending them on the first page ensures they are visible.

    // Simple approach: prepend invites to the result
    const finalFormatted = [...formattedInvites, ...formattedUsers];

    res.json(finalFormatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= HOD PLACEMENT STATS ================= */
exports.getHodPlacementStats = async (req, res) => {
  try {
    const department = req.user.department;
    const collegeFilter = req.user.collegeId ? { collegeId: req.user.collegeId } : {}

    // Aggregation to count placement status
    const stats = await User.aggregate([
      { $match: { role: ROLES.STUDENT, department, ...collegeFilter } },
      {
        $group: {
          _id: "$placementStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalStudents = await User.countDocuments({ role: ROLES.STUDENT, department, ...collegeFilter });

    const placedCount = stats.find(s => s._id === "placed")?.count || 0;
    const placementRate = totalStudents > 0 ? ((placedCount / totalStudents) * 100).toFixed(1) : 0;

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const placedByMonth = await User.aggregate([
      { $match: { role: ROLES.STUDENT, department, placementStatus: "placed", updatedAt: { $gte: sixMonthsAgo }, ...collegeFilter } },
      {
        $group: {
          _id: { y: { $year: "$updatedAt" }, m: { $month: "$updatedAt" } },
          placed: { $sum: 1 },
        },
      },
    ])

    const monthLookup = {}
    for (const row of placedByMonth) {
      monthLookup[`${row._id.y}-${row._id.m}`] = row.placed
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyData = []
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date()
      d.setMonth(d.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      monthlyData.push({ month: monthNames[d.getMonth()], placed: monthLookup[key] || 0 })
    }

    const partnerCompanies = await Company.countDocuments(req.user.collegeId ? { collegeId: req.user.collegeId } : {})

    const topCompanies = await User.aggregate([
      { $match: { role: ROLES.STUDENT, department, placementStatus: "placed", ...collegeFilter } },
      { $group: { _id: "$company", students: { $sum: 1 } } },
      { $match: { _id: { $type: "string", $ne: "" } } },
      { $sort: { students: -1 } },
      { $limit: 5 },
    ])

    res.json({
      totalPlaced: placedCount,
      placementRate: Number(placementRate),
      partnerCompanies,
      avgPackage: null,
      monthlyData,
      companyData: topCompanies.map((c) => ({ company: c._id, students: c.students })),
      packageData: []
    });
  } catch (error) {
    logger.error("hod_placement_stats_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ error: error.message });
  }
};

/* ================= HOD APPROVALS ================= */
exports.getApprovals = async (req, res) => {
  try {
    const approvals = await Approval.find({ department: req.user.department })
      .populate("studentId", "name email mobileNumber rollNo")
      .sort({ createdAt: -1 });

    const formatted = approvals.map(a => ({
      id: a._id,
      studentName: a.studentId ? a.studentId.name : "Unknown",
      rollNo: a.studentId ? (a.studentId.rollNo || "N/A") : "N/A",
      requestType: a.requestType,
      requestDate: a.requestDate.toISOString().split('T')[0],
      description: a.description,
      status: a.status
    }));

    res.json(formatted);
  } catch (error) {
    logger.error("hod_approvals_fetch_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ error: error.message });
  }
};

exports.updateApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const approval = await Approval.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!approval) {
      return res.status(404).json({ message: "Approval request not found" });
    }

    res.json({ message: "Status updated", approval });
  } catch (error) {
    logger.error("hod_approval_update_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ error: error.message });
  }
};

/* ================= HOD PROFILE ================= */
exports.getHodProfile = async (req, res) => {
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
    logger.error("hod_profile_fetch_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ error: error.message });
  }
};

exports.updateHodProfile = async (req, res) => {
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
    logger.error("hod_profile_update_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ error: error.message });
  }
};

/* ================= PLACEMENT DASHBOARD ================= */
exports.placementDashboard = async (req, res) => {
  const {
    department,
    batch,
    minCGPA,
    year,
    sortBy = "cgpa",
    order = "desc"
  } = req.query;

  let filter = { role: ROLES.STUDENT };

  if (department) filter.department = department;
  if (batch) filter.batch = batch;
  if (year) filter.year = Number(year);
  if (minCGPA) filter.cgpa = { $gte: Number(minCGPA) };
  if (req.user.collegeId) filter.collegeId = req.user.collegeId;

  let sort = {};
  sort[sortBy] = order === "asc" ? 1 : -1;

  const students = await User.find(filter)
    .select("name department batch cgpa year")
    .sort(sort);

  const activeJobsCount = await PlacementDrive.countDocuments({
    ...(req.user.collegeId ? { collegeId: req.user.collegeId } : {}),
    deletedAt: null,
    status: { $in: ["draft", "open"] },
  });

  res.json({
    totalStudents: students.length,
    activeJobsCount,
    students
  });
};

/* ================= PRINCIPAL DASHBOARD ================= */
exports.principalDashboard = async (req, res) => {
  const collegeFilter = req.user.collegeId ? { collegeId: req.user.collegeId } : {}
  const [stats, configuredDepartments, capacity] = await Promise.all([
    User.aggregate([
      { $match: { role: ROLES.STUDENT, ...collegeFilter } },
      {
        $group: {
          _id: "$department",
          totalStudents: { $sum: 1 },
          avgCGPA: { $avg: "$cgpa" }
        }
      },
      { $sort: { avgCGPA: -1 } }
    ]),
    req.user.collegeId ? Department.countDocuments({ collegeId: req.user.collegeId }) : 0,
    req.user.collegeId ? getCollegeDepartmentCapacity(req.user.collegeId) : {
      departmentLimit: null,
      departmentCount: 0,
      remainingDepartmentSlots: null,
    },
  ])

  res.json({
    departments: stats,
    departmentsCount: stats.length,
    configuredDepartments,
    departmentLimit: capacity.departmentLimit,
    departmentCount: capacity.departmentCount,
    remainingDepartmentSlots: capacity.remainingDepartmentSlots,
  });
};

/* ================= PLACEMENT PROFILE ================= */
exports.getPlacementProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password_hash");
    res.json({
      fullName: user.name,
      email: user.email,
      phone: user.mobileNumber,
      alternateEmail: user.alternateEmail,
      emergencyContact: user.emergencyContact,
      designation: user.designation,
      employeeId: user.employeeId,
      department: user.department,
      tenure: user.tenure,
      office: user.office,
      officeHours: user.officeHours,
      location: user.location,
      targetCompanies: user.targetCompanies,
      achievements: user.achievements,
      bio: user.bio
    });
  } catch (error) {
    logger.error("placement_profile_fetch_failed", { requestId: req.requestId || null, message: error.message });
    res.status(500).json({ error: error.message });
  }
};

exports.updatePlacementProfile = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.fullName) updateData.name = req.body.fullName;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.phone) updateData.mobileNumber = req.body.phone;

    ["alternateEmail", "emergencyContact", "designation", "employeeId",
      "department", "tenure", "office", "officeHours", "location",
      "targetCompanies", "achievements", "bio"].forEach(f => {
        if (req.body[f] !== undefined) updateData[f] = req.body[f];
      });

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
    res.json({
      fullName: user.name,
      email: user.email,
      phone: user.mobileNumber,
      alternateEmail: user.alternateEmail,
      emergencyContact: user.emergencyContact,
      designation: user.designation,
      employeeId: user.employeeId,
      department: user.department,
      tenure: user.tenure,
      office: user.office,
      officeHours: user.officeHours,
      location: user.location,
      targetCompanies: user.targetCompanies,
      achievements: user.achievements,
      bio: user.bio
    });
  } catch (error) {
    logger.error("placement_profile_update_failed", { requestId: req.requestId || null, message: error.message });
    res.status(500).json({ error: error.message });
  }
};