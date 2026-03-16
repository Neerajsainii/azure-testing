const User = require("../models/User")
const Resume = require("../models/Resume")
const StudentAcademicProfile = require("../models/StudentAcademicProfile")
const { ROLES } = require("../constants/roles")

function normalizeSkills(values) {
  return (values || []).map((s) => String(s || "").trim().toLowerCase()).filter(Boolean)
}

async function getStudentDataForCollege(collegeId) {
  const users = await User.find({
    role: ROLES.STUDENT,
    status: "active",
    collegeId,
  })
    .select("_id collegeId department year batch cgpa placementStatus")
    .lean()

  const userIds = users.map((u) => u._id)
  const [profiles, resumes] = await Promise.all([
    StudentAcademicProfile.find({ userId: { $in: userIds } }).lean(),
    Resume.find({ userId: { $in: userIds } }).select("userId skills atsScore jobMatchScore").lean(),
  ])

  const profileByUserId = new Map(profiles.map((p) => [String(p.userId), p]))
  const resumeByUserId = new Map(resumes.map((r) => [String(r.userId), r]))

  return users.map((u) => {
    const profile = profileByUserId.get(String(u._id)) || null
    const resume = resumeByUserId.get(String(u._id)) || null
    return { user: u, profile, resume }
  })
}

function checkStudentEligibility(bundle, drive) {
  const criteria = drive.eligibility || {}
  const { user, profile, resume } = bundle
  const reasons = []

  const year = profile?.year || user.year || null
  const department = user.department || ""
  const cgpa = profile?.cgpa || user.cgpa || 0
  const percentage10 = profile?.percentage10 || 0
  const percentage12 = profile?.percentage12 || 0
  const backlogsCount = profile?.backlogsCount || 0
  const gapYears = profile?.gapYears || 0
  const attendancePercent = profile?.attendancePercent || 0
  const atsScore = resume?.atsScore || 0
  const jobMatchScore = resume?.jobMatchScore || 0

  const studentSkills = new Set([
    ...normalizeSkills(profile?.skills),
    ...normalizeSkills(resume?.skills),
  ])
  const requiredSkills = normalizeSkills(criteria.requiredSkills)

  const checks = [
    { ok: cgpa >= (criteria.minCgpa || 0), fail: `CGPA < ${criteria.minCgpa || 0}` },
    { ok: percentage10 >= (criteria.minPercentage10 || 0), fail: `10th % < ${criteria.minPercentage10 || 0}` },
    { ok: percentage12 >= (criteria.minPercentage12 || 0), fail: `12th % < ${criteria.minPercentage12 || 0}` },
    { ok: backlogsCount <= (criteria.maxBacklogs ?? 99), fail: `Backlogs > ${criteria.maxBacklogs ?? 99}` },
    { ok: gapYears <= (criteria.maxGapYears ?? 99), fail: `Gap years > ${criteria.maxGapYears ?? 99}` },
    { ok: attendancePercent >= (criteria.minAttendancePercent || 0), fail: `Attendance < ${criteria.minAttendancePercent || 0}` },
    { ok: atsScore >= (criteria.minAtsScore || 0), fail: `ATS < ${criteria.minAtsScore || 0}` },
    { ok: jobMatchScore >= (criteria.minJobMatchScore || 0), fail: `Job match < ${criteria.minJobMatchScore || 0}` },
  ]

  if (Array.isArray(criteria.allowedDepartments) && criteria.allowedDepartments.length > 0) {
    const ok = criteria.allowedDepartments.includes(department)
    checks.push({ ok, fail: "Department not allowed" })
  }

  if (Array.isArray(criteria.allowedYears) && criteria.allowedYears.length > 0) {
    const ok = year && criteria.allowedYears.includes(Number(year))
    checks.push({ ok, fail: "Year not allowed" })
  }

  for (const skill of requiredSkills) {
    if (!studentSkills.has(skill)) reasons.push(`Missing skill: ${skill}`)
  }

  for (const check of checks) {
    if (!check.ok) reasons.push(check.fail)
  }

  return {
    eligible: reasons.length === 0,
    eligibilityReason: reasons.length === 0 ? "All eligibility checks passed" : reasons.join("; "),
    department,
  }
}

module.exports = {
  getStudentDataForCollege,
  checkStudentEligibility,
}
