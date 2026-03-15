const Resume = require("../models/Resume")
const fs = require("fs")
const path = require("path")
const {
  generateATSScore,
  extractSkillsFromJob,
  getJobMatchScore,
  evaluateProjectForJob,
} = require("../services/aiService")
const logAudit = require("../utils/auditLogger")
const { logger } = require("../utils/logger")

const TEMPLATE_ROOT = path.join(__dirname, "../templates/resumeTemplates")
const TEMPLATE_WHITELIST = new Set(["classic", "modern"])

// Detect Azure Functions runtime once at module load — used to gate
// Chromium-dependent features cleanly without crashing the worker.
const IS_AZURE_FUNCTIONS = Boolean(process.env.FUNCTIONS_WORKER_RUNTIME)

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildResumeText(resume) {
  const parts = []
  if (resume.personalInfo) {
    parts.push(`Name: ${resume.personalInfo.fullName || ""}`)
    parts.push(`Email: ${resume.personalInfo.email || ""}`)
    parts.push(`Phone: ${resume.personalInfo.phone || ""}`)
  }
  if (resume.profileSummary) parts.push(`Summary: ${resume.profileSummary}`)
  if (resume.skills?.length) parts.push(`Skills: ${resume.skills.join(", ")}`)
  if (resume.education?.length) {
    resume.education.forEach((e) =>
      parts.push(`${e.degree} at ${e.institution} (${e.year || ""})`)
    )
  }
  if (resume.projects?.length) {
    resume.projects.forEach((p) =>
      parts.push(`${p.title}: ${p.description || ""} (${p.technologies || ""})`)
    )
  }
  if (resume.certifications?.length) {
    resume.certifications.forEach((c) =>
      parts.push(`${c.name} (${c.issuedBy || ""} ${c.year || ""})`)
    )
  }
  return parts.join("\n")
}

function renderList(items) {
  return (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")
}

function resolveTemplatePath(templateName) {
  const normalizedTemplate = String(templateName || "").trim().toLowerCase()
  if (!TEMPLATE_WHITELIST.has(normalizedTemplate)) {
    const error = new Error("Template not supported")
    error.statusCode = 400
    error.code = "INVALID_TEMPLATE"
    throw error
  }

  const templatePath = path.join(TEMPLATE_ROOT, `${normalizedTemplate}.html`)
  const resolvedTemplatePath = path.resolve(templatePath)
  const resolvedRoot = path.resolve(TEMPLATE_ROOT)

  if (!resolvedTemplatePath.startsWith(resolvedRoot)) {
    const error = new Error("Invalid template path")
    error.statusCode = 400
    error.code = "INVALID_TEMPLATE_PATH"
    throw error
  }

  return resolvedTemplatePath
}

/* =========================
   CREATE / UPDATE RESUME
========================= */
exports.saveResume = async (req, res, next) => {
  try {
    const userId = req.user.id

    let resume = await Resume.findOne({ userId })
    if (!resume) {
      resume = new Resume({ userId })
    }

    const allowedFields = [
      "personalInfo",
      "education",
      "skills",
      "projects",
      "certifications",
      "profileSummary",
      "experienceLevel",
    ]

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        resume[field] = req.body[field]
      }
    })

    let completed = 0
    if (resume.personalInfo?.fullName) completed += 1
    if (resume.education?.length) completed += 1
    if (resume.skills?.length) completed += 1
    if (resume.projects?.length) completed += 1
    if (resume.certifications?.length) completed += 1

    resume.resumeCompletion = Math.round((completed / 5) * 100)
    await resume.save()

    await logAudit(req.user, "RESUME_UPDATED", "Resume", resume._id, req)

    return res.status(200).json({
      message: "Resume saved successfully",
      resumeCompletion: resume.resumeCompletion,
    })
  } catch (error) {
    return next(error)
  }
}

/* =========================
   GET RESUME
========================= */
exports.getMyResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id })
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" })
    }
    return res.status(200).json(resume)
  } catch (error) {
    return next(error)
  }
}

/* =========================
   SELECT TEMPLATE
========================= */
exports.selectTemplate = async (req, res, next) => {
  try {
    const { template } = req.body
    const normalizedTemplate = String(template || "").trim().toLowerCase()

    if (!TEMPLATE_WHITELIST.has(normalizedTemplate)) {
      return res.status(400).json({ message: "Template is not supported" })
    }

    const resume = await Resume.findOne({ userId: req.user.id })
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" })
    }

    resume.selectedTemplate = normalizedTemplate
    await resume.save()

    return res.status(200).json({ message: "Template selected successfully" })
  } catch (error) {
    return next(error)
  }
}

/* =========================
   PREVIEW RESUME (HTML)
========================= */
exports.previewResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id })
    if (!resume) return res.status(404).json({ message: "Resume not found" })
    if (!resume.selectedTemplate) return res.status(400).json({ message: "Template not selected" })

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 30px; color: #333; }
            h1 { color: #2c3e50; }
            h2 { margin-top: 20px; color: #34495e; }
            ul { padding-left: 20px; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(resume.personalInfo?.fullName || "")}</h1>
          <p>${escapeHtml(resume.personalInfo?.email || "")} | ${escapeHtml(resume.personalInfo?.phone || "")}</p>

          <h2>Profile Summary</h2>
          <p>${escapeHtml(resume.profileSummary || "")}</p>

          <h2>Skills</h2>
          <ul>${renderList(resume.skills || [])}</ul>

          <h2>Education</h2>
          <ul>${(resume.education || []).map((e) =>
            `<li>${escapeHtml(e.degree)} - ${escapeHtml(e.institution)} (${escapeHtml(e.year)})</li>`
          ).join("")}</ul>

          <h2>Projects</h2>
          <ul>${(resume.projects || []).map((p) =>
            `<li><strong>${escapeHtml(p.title)}</strong>: ${escapeHtml(p.description)}</li>`
          ).join("")}</ul>

          <h2>ATS Score</h2>
          <p>${Number(resume.atsScore || 0)}</p>
        </body>
      </html>
    `

    return res.status(200).json({
      message: "Resume preview generated",
      html,
    })
  } catch (error) {
    return next(error)
  }
}

/* =========================
   CALCULATE ATS SCORE
========================= */
exports.calculateATSScore = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id })
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" })
    }

    const resumeText = buildResumeText(resume)
    if (!resumeText.trim()) {
      return res.status(200).json({
        status: "incomplete",
        message: "Resume is incomplete",
        atsScore: 0,
      })
    }

    const aiResult = await generateATSScore(resumeText)

    resume.atsScore = Number(aiResult.atsScore || 0)
    resume.jobMatchScore = Number(aiResult.jobMatchScore || 0)
    resume.extractedSkills = Array.isArray(aiResult.skills) ? aiResult.skills : []
    resume.missingSkills = Array.isArray(aiResult.missingSkills) ? aiResult.missingSkills : []
    resume.calibrationReasons = aiResult.calibrationReasons || {
      atsScoreReason: "",
      jobMatchReason: "",
      topStrengths: [],
      improvementAreas: [],
    }
    resume.skills = Array.isArray(aiResult.skills) ? aiResult.skills : []
    resume.lastAIScoredAt = new Date()

    await resume.save()
    await logAudit(req.user, "ATS_CALCULATED", "Resume", resume._id, req)

    return res.json({
      message: "ATS scoring completed",
      atsScore: resume.atsScore,
      jobMatchScore: resume.jobMatchScore,
      skills: resume.skills,
      missingSkills: resume.missingSkills || [],
      calibrationReasons: resume.calibrationReasons || {
        atsScoreReason: "",
        jobMatchReason: "",
        topStrengths: [],
        improvementAreas: [],
      },
    })
  } catch (error) {
    logger.error("resume_ats_calculation_failed", {
      requestId: req.requestId || null,
      message: error.message,
    })
    return res.status(503).json({
      message: "AI service is temporarily unavailable, please try again later."
    })
  }
}

/* =========================
   GET ATS SCORE
========================= */
exports.getATSScore = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id }).select(
      "atsScore jobMatchScore skills missingSkills calibrationReasons lastAIScoredAt"
    )

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" })
    }

    return res.status(200).json({
      atsScore: resume.atsScore ?? 0,
      jobMatchScore: resume.jobMatchScore ?? 0,
      skills: resume.skills || [],
      missingSkills: resume.missingSkills || [],
      calibrationReasons: resume.calibrationReasons || {
        atsScoreReason: "",
        jobMatchReason: "",
        topStrengths: [],
        improvementAreas: [],
      },
      lastAIScoredAt: resume.lastAIScoredAt || null,
    })
  } catch (error) {
    return next(error)
  }
}

/* =========================
   AI HELPERS
========================= */
exports.extractSkills = async (req, res, next) => {
  try {
    const { jobDescription } = req.body || {}
    const skills = await extractSkillsFromJob(jobDescription || "")
    return res.status(200).json(skills)
  } catch (error) {
    logger.error("resume_extract_skills_failed", { requestId: req.requestId || null, message: error.message })
    return next(error)
  }
}

exports.jobMatch = async (req, res, next) => {
  try {
    const { jobDescription } = req.body || {}
    const resume = await Resume.findOne({ userId: req.user.id })
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" })
    }
    const resumeText = buildResumeText(resume)
    const result = await getJobMatchScore(resumeText, jobDescription || "")
    return res.status(200).json(result)
  } catch (error) {
    logger.error("resume_job_match_failed", { requestId: req.requestId || null, message: error.message })
    return next(error)
  }
}

exports.evaluateProject = async (req, res, next) => {
  try {
    const { projectTitle, projectDescription, jobDescription } = req.body || {}
    const result = await evaluateProjectForJob(
      projectTitle || "",
      projectDescription || "",
      jobDescription || ""
    )
    return res.status(200).json(result)
  } catch (error) {
    logger.error("resume_project_eval_failed", { requestId: req.requestId || null, message: error.message })
    return next(error)
  }
}

/* =========================
   DOWNLOAD RESUME PDF
========================= */
exports.downloadResume = async (req, res, next) => {
  // PDF generation via Chromium is temporarily disabled in Azure Functions.
  // @sparticuz/chromium binary is compiled for AWS Lambda (Amazon Linux 2),
  // not Azure's Ubuntu runtime, and exceeds the 100MB SWA deployment zip limit.
  // TODO: Replace with pdfkit/pdf-lib implementation.
  if (IS_AZURE_FUNCTIONS) {
    return res.status(503).json({
      success: false,
      code: "PDF_UNAVAILABLE",
      message: "PDF download is temporarily unavailable. Please try again later.",
    })
  }

  // ── Local development path ────────────────────────────────────────────────
  let browser = null

  try {
    const resume = await Resume.findOne({ userId: req.user.id })
    if (!resume || !resume.selectedTemplate) {
      return res.status(400).json({ message: "Resume data or template missing" })
    }

    const templatePath = resolveTemplatePath(resume.selectedTemplate)
    let html = fs.readFileSync(templatePath, "utf-8")

    html = html
      .replace("{{name}}", escapeHtml(resume.personalInfo?.fullName || ""))
      .replace("{{email}}", escapeHtml(resume.personalInfo?.email || ""))
      .replace("{{phone}}", escapeHtml(resume.personalInfo?.phone || ""))
      .replace("{{summary}}", escapeHtml(resume.profileSummary || ""))
      .replace("{{skills}}", renderList(resume.skills || []))
      .replace("{{education}}", (resume.education || []).map((e) =>
        `<li>${escapeHtml(e.degree)} - ${escapeHtml(e.institution)} (${escapeHtml(e.year)})</li>`
      ).join(""))
      .replace("{{projects}}", (resume.projects || []).map((p) =>
        `<li><strong>${escapeHtml(p.title)}</strong>: ${escapeHtml(p.description)}</li>`
      ).join(""))
      .replace("{{atsScore}}", String(Number(resume.atsScore || 0)))

    // Lazy require — keeps puppeteer/chromium out of the module load path
    // entirely, so a missing devDependency never crashes the worker.
    const { getBrowser } = require("../utils/browserLauncher")
    browser = await getBrowser()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    })

    resume.pdfGeneratedAt = new Date()
    await resume.save()

    await logAudit(req.user, "RESUME_DOWNLOADED", "Resume", resume._id, req)

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=resume.pdf",
    })
    return res.send(pdfBuffer)
  } catch (error) {
    logger.error("resume_pdf_download_failed", {
      requestId: req.requestId || null,
      message: error.message,
    })
    return next(error)
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch {
        // Ignore browser close failures.
      }
    }
  }
}