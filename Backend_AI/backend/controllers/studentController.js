const User = require("../models/User")
const StudentAcademicProfile = require("../models/StudentAcademicProfile")
const PlacementDrive = require("../models/PlacementDrive")
const { logger } = require("../utils/logger")
const DriveCandidate = require("../models/DriveCandidate")
const Resume = require("../models/Resume")

function setIfPresent(target, key, value) {
  if (value !== undefined) target[key] = value
}

// GET Student Profile
exports.getStudentProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId).select("-password_hash")
    if (!user) {
      return res.status(404).json({ message: "Student not found" })
    }

    let userObj = user.toObject()

    // Also fetch the Resume to provide personalInfo to the frontend
    const resume = await Resume.findOne({ userId }).select("personalInfo")
    if (resume && resume.personalInfo) {
      userObj.personalInfo = resume.personalInfo
    }

    return res.status(200).json(userObj)
  } catch (error) {
    logger.error("student_profile_fetch_failed", {
      requestId: req.requestId || null,
      message: error.message,
    })
    return next(error)
  }
}

// GET Openings for Student
exports.getOpenings = async (req, res, next) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "Student not found" })
    }

    const collegeId = user.collegeId
    if (!collegeId) {
      return res.status(400).json({ message: "Student not assigned to college" })
    }

    const drives = await PlacementDrive.find({
      collegeId: collegeId,
      status: "open",
      deletedAt: null
    })
      .populate("companyId", "name")
      .sort({ createdAt: -1 })
      .lean()

    return res.status(200).json({
      drives: drives.map((d) => ({
        id: d._id,
        title: d.title,
        company: d.companyId?.name || "Unknown",
        companyDescription: d.companyDescription,
        postedDate: d.createdAt,
        criteria: d.eligibility,
        status: d.status
      }))
    })
  } catch (error) {
    logger.error("student_openings_fetch_failed", {
      requestId: req.requestId || null,
      message: error.message,
    })
    return next(error)
  }
}

// POST Apply to a Placement Drive
exports.applyToDrive = async (req, res, next) => {
  try {
    const studentId = req.user.id
    const driveId = req.params.id

    const user = await User.findById(studentId)
    if (!user) {
      return res.status(404).json({ message: "Student not found" })
    }
    const drive = await PlacementDrive.findById(driveId)
    if (!drive || drive.deletedAt) {
      return res.status(404).json({ message: "Drive not found" })
    }
    if (String(user.collegeId || "") !== String(drive.collegeId || "")) {
      return res.status(403).json({ message: "Access denied for this drive" })
    }
    if (drive.status !== "open") {
      return res.status(400).json({ message: "Drive is closed" })
    }

    try {
      const candidate = await DriveCandidate.create({
        driveId: drive._id,
        studentId,
        collegeId: drive.collegeId,
        department: user.department || "",
        eligibilityReason: "applied_by_student",
        roundStatus: { aptitude: "pending", gd: "pending", interview: "pending" },
        finalStatus: "shortlisted",
      })
      return res.status(201).json({ message: "Applied successfully", application: candidate })
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ message: "Already applied to this drive" })
      }
      throw err
    }
  } catch (error) {
    logger.error("student_apply_failed", {
      requestId: req.requestId || null,
      message: error.message,
    })
    return next(error)
  }
}

// GET My Applications
exports.getApplications = async (req, res, next) => {
  try {
    const studentId = req.user.id
    const rows = await DriveCandidate.find({ studentId })
      .populate("driveId", "title companyId createdAt status")
      .populate({ path: "driveId", populate: { path: "companyId", select: "name" } })
      .sort({ createdAt: -1 })
      .lean()

    return res.status(200).json({
      count: rows.length,
      applications: rows.map((r) => ({
        id: r._id,
        driveId: r.driveId?._id || r.driveId,
        title: r.driveId?.title || "",
        company: r.driveId?.companyId?.name || "",
        appliedAt: r.createdAt,
        finalStatus: r.finalStatus,
        roundStatus: r.roundStatus,
      })),
    })
  } catch (error) {
    logger.error("student_applications_fetch_failed", {
      requestId: req.requestId || null,
      message: error.message,
    })
    return next(error)
  }
}
// CREATE / UPDATE Student Profile
exports.updateStudentProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const {
      name,
      department,
      year,
      phone,
      college,
      profile_photo,
      section,
      cgpa,
      percentage10,
      percentage12,
      backlogsCount,
      gapYears,
      attendancePercent,
      skills,
      batch,
      address,
      linkedin,
      github,
      portfolio,
    } = req.body

    const userUpdates = {}
    setIfPresent(userUpdates, "name", name)
    setIfPresent(userUpdates, "department", department)
    if (year !== undefined) userUpdates.year = Number(year)
    if (cgpa !== undefined) userUpdates.cgpa = Number(cgpa)
    setIfPresent(userUpdates, "batch", batch)
    setIfPresent(userUpdates, "mobileNumber", phone)
    setIfPresent(userUpdates, "collegeName", college)
    setIfPresent(userUpdates, "profile_photo", profile_photo)

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: userUpdates },
      { new: true, runValidators: true }
    ).select("-password_hash")

    if (!updatedUser) {
      return res.status(404).json({ message: "Student not found" })
    }

    await StudentAcademicProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          collegeId: updatedUser.collegeId || null,
          departmentId: updatedUser.departmentId || null,
          section: section || "",
          year: year !== undefined ? Number(year) : updatedUser.year || null,
          batch: batch || updatedUser.batch || "",
          cgpa: cgpa !== undefined ? Number(cgpa) : updatedUser.cgpa || 0,
          percentage10: percentage10 !== undefined ? Number(percentage10) : 0,
          percentage12: percentage12 !== undefined ? Number(percentage12) : 0,
          backlogsCount: backlogsCount !== undefined ? Number(backlogsCount) : 0,
          gapYears: gapYears !== undefined ? Number(gapYears) : 0,
          attendancePercent: attendancePercent !== undefined ? Number(attendancePercent) : 0,
          skills: Array.isArray(skills) ? skills : [],
        },
      },
      { upsert: true, new: true }
    )

    const updatedResume = await Resume.findOneAndUpdate(
      { userId },
      {
        $set: {
          "personalInfo.fullName": updatedUser.name,
          "personalInfo.email": updatedUser.email,
          "personalInfo.phone": updatedUser.mobileNumber || "",
          "personalInfo.address": address || "",
          "personalInfo.linkedin": linkedin || "",
          "personalInfo.github": github || "",
          "personalInfo.portfolio": portfolio || "",
        }
      },
      { upsert: true, new: true }
    )

    // Recalculate Profile Completion
    let completed = 0
    if (updatedResume.personalInfo?.fullName) completed += 1
    if (updatedResume.education?.length) completed += 1
    if (updatedResume.skills?.length) completed += 1
    if (updatedResume.projects?.length) completed += 1
    if (updatedResume.certifications?.length) completed += 1

    updatedResume.resumeCompletion = Math.round((completed / 5) * 100)
    await updatedResume.save()

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    logger.error("student_profile_update_failed", {
      requestId: req.requestId || null,
      message: error.message,
    })
    return next(error)
  }
}
