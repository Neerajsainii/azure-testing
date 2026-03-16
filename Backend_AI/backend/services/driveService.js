const PlacementDrive = require("../models/PlacementDrive")
const DriveCandidate = require("../models/DriveCandidate")
const DriveNotification = require("../models/PlacementNotification")
const Company = require("../models/Company")
const { getAcademicYearInfo } = require("../utils/academicYearUtil")
const { getStudentDataForCollege, checkStudentEligibility } = require("./eligibilityService")
const { logger } = require("../utils/logger")

async function recomputeDriveCandidates(drive) {
  const bundles = await getStudentDataForCollege(drive.collegeId)
  const upserts = []

  for (const bundle of bundles) {
    const decision = checkStudentEligibility(bundle, drive)
    if (!decision.eligible) continue

    upserts.push({
      updateOne: {
        filter: { driveId: drive._id, studentId: bundle.user._id },
        update: {
          $set: {
            driveId: drive._id,
            studentId: bundle.user._id,
            collegeId: drive.collegeId,
            department: decision.department || "",
            eligibilityReason: decision.eligibilityReason,
          },
          $setOnInsert: {
            finalStatus: "shortlisted",
            roundStatus: { aptitude: "pending", gd: "pending", interview: "pending" },
          },
        },
        upsert: true,
      },
    })
  }

  // Delete ONLY auto-shortlisted candidates that are still pending everywhere
  await DriveCandidate.deleteMany({
    driveId: drive._id,
    eligibilityReason: { $ne: "applied_by_student" },
    "roundStatus.aptitude": "pending",
    "roundStatus.gd": "pending",
    "roundStatus.interview": "pending",
    finalStatus: "shortlisted"
  })

  if (upserts.length > 0) {
    await DriveCandidate.bulkWrite(upserts, { ordered: false })
  }

  return { shortlistedCount: upserts.length }
}

async function createDrive(payload, actor) {
  let companyId = payload.companyId || null
  if (!companyId && payload.company) {
    const name = String(payload.company).trim()
    if (name) {
      const company = await Company.findOneAndUpdate(
        { name },
        { $setOnInsert: { name, description: payload.companyDescription || payload.description || "", createdBy: actor._id } },
        { upsert: true, new: true }
      )
      companyId = company._id
    }
  }
  if (!companyId) throw new Error("companyId or company is required")

  const academicYearLabel = payload.academicYearLabel || getAcademicYearInfo().label
  const drive = await PlacementDrive.create({
    collegeId: actor.collegeId,
    companyId,
    createdBy: actor._id,
    title: payload.title,
    companyDescription: payload.companyDescription || payload.description || `${payload.title || "Drive"} description`,
    academicYearLabel,
    status: payload.status || "open",
    eligibility: payload.eligibility || {},
  })

  const recompute = await recomputeDriveCandidates(drive)

  await DriveNotification.create({
    collegeId: actor.collegeId,
    targetRoles: ["student", "hod", "principal", "placement_officer"],
    title: `New drive: ${drive.title}`,
    body: `${recompute.shortlistedCount} students auto-shortlisted.`,
    meta: { driveId: drive._id },
  })

  return { drive, recompute }
}

async function updateDrive(drive, payload) {
  if (payload.title !== undefined) drive.title = payload.title
  if (payload.companyDescription !== undefined) drive.companyDescription = payload.companyDescription
  if (payload.status !== undefined) drive.status = payload.status
  if (payload.academicYearLabel !== undefined) drive.academicYearLabel = payload.academicYearLabel
  if (payload.eligibility && typeof payload.eligibility === "object") {
    drive.eligibility = { ...(drive.eligibility || {}), ...payload.eligibility }
  }
  await drive.save()

  const recompute = await recomputeDriveCandidates(drive)
  logger.info("drive_recomputed", { driveId: String(drive._id), shortlistedCount: recompute.shortlistedCount })
  return { drive, recompute }
}

const { extractSkillsFromJob, getJobMatchScore } = require("./aiService")
const Resume = require("../models/Resume")
const { env } = require("../config/env")

function normalizeSkills(values) {
  return (values || []).map((s) => String(s || "").trim().toLowerCase()).filter(Boolean)
}

function simpleExtractSkills(jobDescription) {
  const text = String(jobDescription || "").toLowerCase()
  const catalog = [
    "react", "node.js", "node", "typescript", "javascript", "css", "html", "tailwind", "bootstrap",
    "next.js", "express", "redux", "graphql", "rest", "java", "python", "django", "flask", "spring",
    "sql", "mysql", "postgres", "mongodb", "docker", "kubernetes", "git", "linux", "azure", "aws", "gcp",
    "communication", "teamwork", "leadership", "problem solving", "testing", "jest", "cypress"
  ]
  const found = new Set()
  for (const k of catalog) {
    if (text.includes(k)) found.add(k)
  }
  return Array.from(found)
}

async function findEligibleStudentsForJob(collegeId, jobDescription) {
  let requiredSkills = []
  try {
    const { skills: requiredSkillsRaw } = await extractSkillsFromJob(jobDescription)
    requiredSkills = normalizeSkills(requiredSkillsRaw)
  } catch (_err) {
    requiredSkills = normalizeSkills(simpleExtractSkills(jobDescription))
  }

  const students = await getStudentDataForCollege(collegeId)
  const results = []

  // Basic batching: cap at 200 to avoid excessive AI calls
  const candidates = students.slice(0, 200)

  const azureEnabled = !!(env.azureOpenAiApiKey && env.azureOpenAiEndpoint && env.azureOpenAiDeployment)

  const candidateIds = candidates.map((bundle) => bundle.user._id)
  const resumes = await Resume.find({ userId: { $in: candidateIds } }).lean()
  const resumeByUserId = new Map(resumes.map((resume) => [String(resume.userId), resume]))

  for (const bundle of candidates) {
    const resume = resumeByUserId.get(String(bundle.user._id)) || null
    if (!resume) continue

    const studentSkills = new Set([
      ...normalizeSkills(bundle.profile?.skills),
      ...normalizeSkills(resume.skills),
    ])
    const missingSkills = requiredSkills.filter((s) => !studentSkills.has(s))
    const matchedSkills = requiredSkills.filter((s) => studentSkills.has(s))
    const overlapScore = requiredSkills.length > 0 ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 0

    let aiScore = null
    if (azureEnabled) {
      try {
        const resumeText = buildResumeText(resume)
        const match = await getJobMatchScore(resumeText, jobDescription)
        aiScore = Number(match.matchScore) || 0
      } catch (_err) {
        aiScore = null
      }
    }

    const matchScore = aiScore !== null ? Math.round(0.7 * aiScore + 0.3 * overlapScore) : overlapScore

    if (matchScore >= 40) {
      results.push({
        id: bundle.user._id,
        name: bundle.user.name,
        email: bundle.user.email,
        department: bundle.user.department || "",
        year: bundle.user.year || null,
        cgpa: bundle.profile?.cgpa || bundle.user.cgpa || 0,
        matchScore,
        skillsMatched: matchedSkills,
        missingSkills,
      })
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore)
}

function buildResumeText(resume) {
  // Simple builder matching resumeController logic
  const parts = []
  if (resume.skills?.length) parts.push(`Skills: ${resume.skills.join(", ")}`)
  if (resume.projects?.length) {
    resume.projects.forEach((p) => parts.push(`${p.title}: ${p.description || ""}`))
  }
  return parts.join("\n")
}

module.exports = {
  createDrive,
  updateDrive,
  recomputeDriveCandidates,
  findEligibleStudentsForJob
}
