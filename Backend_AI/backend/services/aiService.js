const axios = require("axios")
const { env } = require("../config/env")
const { logger } = require("../utils/logger")

function getAzureConfig() {
  return {
    endpoint: env.azureOpenAiEndpoint,
    key: env.azureOpenAiApiKey,
    deployment: env.azureOpenAiDeployment,
    apiVersion: env.azureOpenAiApiVersion,
    model: env.azureOpenAiModel,
  }
}

function buildAzureChatUrl(endpoint, deployment, apiVersion) {
  const base = String(endpoint || "")
    .trim()
    .replace(/\/openai\/v1\/?$/i, "")
    .replace(/\/openai\/?$/i, "")
    .replace(/\/$/, "")
  return `${base}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(status) {
  return status === 408 || status === 409 || status === 429 || (status >= 500 && status <= 599)
}

async function createChatCompletion({ messages, temperature = 0.7, max_tokens = 1000 }) {
  const { endpoint, key, deployment, apiVersion, model } = getAzureConfig()
  if (!endpoint || !key || !deployment) {
    throw new Error("Azure OpenAI credentials missing. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT in .env")
  }

  const url = buildAzureChatUrl(endpoint, deployment, apiVersion)
  const payload = {
    messages,
    temperature,
    max_tokens,
  }

  if (model) payload.model = model

  let lastError = null
  for (let attempt = 0; attempt <= env.aiMaxRetries; attempt += 1) {
    try {
      const resp = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json", "api-key": key },
        timeout: env.aiHttpTimeoutMs,
      })
      return resp.data
    } catch (error) {
      lastError = error
      const status = error?.response?.status || 0
      if (attempt < env.aiMaxRetries && isRetryable(status)) {
        const backoffMs = 300 * (2 ** attempt)
        await sleep(backoffMs)
        continue
      }
      break
    }
  }

  const status = lastError?.response?.status || 0
  const message = lastError?.message || "Azure OpenAI request failed"
  logger.error("azure_openai_request_failed", { status, message })
  throw new Error(`Azure OpenAI request failed (${status || "network"}): ${message}`)
}

function parseStrictJson(content) {
  const cleaned = String(content || "")
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()

  return JSON.parse(cleaned)
}

exports.generateATSScore = async (resumeText) => {
  try {
    const prompt = `
You are an ATS resume analyzer. Analyze the resume for formatting, content, and keyword optimization.

Return ONLY pure JSON. No explanation.

{
  "atsScore": number (0-100),
  "jobMatchScore": number (0-100),
  "skills": ["skill1","skill2","skill3"],
  "missingSkills": ["skillA","skillB"],
  "calibrationReasons": {
    "atsScoreReason": "short explanation",
    "jobMatchReason": "short explanation",
    "topStrengths": ["strength1","strength2"],
    "improvementAreas": ["improvement1","improvement2"],
    "suggestedSkills": ["skillX", "skillY"]
  }
}

Resume:
${resumeText}
`

    const response = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const text = response.choices?.[0]?.message?.content
    if (!text) throw new Error("Azure OpenAI returned empty content")

    const parsed = parseStrictJson(text)
    if (
      typeof parsed.atsScore !== "number" ||
      typeof parsed.jobMatchScore !== "number" ||
      !Array.isArray(parsed.skills)
    ) {
      throw new Error("Invalid AI JSON structure")
    }

    if (!Array.isArray(parsed.missingSkills)) parsed.missingSkills = []
    if (!parsed.calibrationReasons || typeof parsed.calibrationReasons !== "object") {
      parsed.calibrationReasons = {
        atsScoreReason: "",
        jobMatchReason: "",
        topStrengths: [],
        improvementAreas: [],
        suggestedSkills: [],
      }
    }
    if (!Array.isArray(parsed.calibrationReasons.topStrengths)) parsed.calibrationReasons.topStrengths = []
    if (!Array.isArray(parsed.calibrationReasons.improvementAreas)) parsed.calibrationReasons.improvementAreas = []
    if (!Array.isArray(parsed.calibrationReasons.suggestedSkills)) parsed.calibrationReasons.suggestedSkills = []
    parsed.calibrationReasons.atsScoreReason = String(parsed.calibrationReasons.atsScoreReason || "")
    parsed.calibrationReasons.jobMatchReason = String(parsed.calibrationReasons.jobMatchReason || "")

    return parsed
  } catch (error) {
    logger.error("azure_openai_ats_failed", { message: error.message })
    throw new Error("AI ATS scoring failed")
  }
}

exports.extractSkillsFromJob = async (jobDescription) => {
  if (!jobDescription || !String(jobDescription).trim()) {
    return { skills: [] }
  }
  try {
    const prompt = `
You are a recruiter. From the job description below, extract a list of technical and soft skills required for the role.
Return ONLY a JSON object with a single key "skills" whose value is an array of skill strings. No other text.

Example: {"skills": ["JavaScript", "React", "Node.js", "Communication"]}

Job Description:
${String(jobDescription).slice(0, 8000)}
`

    const response = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 600,
    })

    const text = response.choices?.[0]?.message?.content
    if (!text) throw new Error("Empty AI response")

    const parsed = parseStrictJson(text)
    const skills = Array.isArray(parsed.skills) ? parsed.skills : []
    return { skills: skills.map((s) => String(s).trim()).filter(Boolean) }
  } catch (error) {
    logger.error("azure_openai_skill_extract_failed", { message: error.message })
    throw new Error("Skill extraction failed")
  }
}

exports.getJobMatchScore = async (resumeText, jobDescription) => {
  if (!resumeText?.trim() || !jobDescription?.trim()) {
    return { matchScore: 0, reason: "", strengths: [], gaps: [] }
  }
  try {
    const prompt = `
You are an ATS. Rate how well this resume matches the job description from 0 to 100.
Consider: relevant skills, experience, education, and projects.
Return ONLY a JSON object:
{
  "matchScore": number,
  "reason": "short explanation",
  "strengths": ["point1","point2"],
  "gaps": ["gap1","gap2"]
}
No other text.

Resume:
${String(resumeText).slice(0, 6000)}

Job Description:
${String(jobDescription).slice(0, 4000)}
`

    const response = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 150,
    })

    const text = response.choices?.[0]?.message?.content
    if (!text) throw new Error("Empty AI response")

    const parsed = parseStrictJson(text)
    let matchScore = Number(parsed.matchScore)
    if (Number.isNaN(matchScore) || matchScore < 0) matchScore = 0
    if (matchScore > 100) matchScore = 100
    return {
      matchScore: Math.round(matchScore),
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map((s) => String(s)) : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map((s) => String(s)) : [],
    }
  } catch (error) {
    logger.error("azure_openai_match_score_failed", { message: error.message })
    throw new Error("Job match scoring failed")
  }
}

exports.evaluateProjectForJob = async (projectTitle, projectDescription, jobDescription) => {
  if (!projectTitle?.trim() || !jobDescription?.trim()) {
    return { qualityScore: 0, relevance: "Missing project or job description", level: "Academic", suggestions: [] }
  }
  try {
    const desc = (projectDescription || "").slice(0, 2000)
    const prompt = `
You are a senior tech lead evaluator. Rate this project's relevance and quality for the given job description.
Determine if the project is "Academic Level" or "Industrial Level".
Provide actionable suggestions to improve the project to make it more industrial-grade and ATS-friendly.

Return ONLY a JSON object:
{
  "qualityScore": number (0-100),
  "relevance": "one short sentence",
  "level": "Industrial" | "Academic",
  "suggestions": ["suggestion1", "suggestion2"]
}
No other text.

Project Title: ${String(projectTitle).slice(0, 500)}
Project Description: ${desc}

Job Description:
${String(jobDescription).slice(0, 4000)}
`

    const response = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 400,
    })

    const text = response.choices?.[0]?.message?.content
    if (!text) throw new Error("Empty AI response")

    const parsed = parseStrictJson(text)
    let qualityScore = Number(parsed.qualityScore)
    if (Number.isNaN(qualityScore) || qualityScore < 0) qualityScore = 0
    if (qualityScore > 100) qualityScore = 100
    
    return {
      qualityScore: Math.round(qualityScore),
      relevance: typeof parsed.relevance === "string" ? parsed.relevance : "",
      level: parsed.level === "Industrial" ? "Industrial" : "Academic",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    }
  } catch (error) {
    logger.error("azure_openai_project_eval_failed", { message: error.message })
    throw new Error("Project evaluation failed")
  }
}
