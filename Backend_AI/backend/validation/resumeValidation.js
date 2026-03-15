const Joi = require("joi")

const textField = Joi.string().trim().max(5000)
const shortField = Joi.string().trim().max(200)

const resumeSaveSchema = Joi.object({
  personalInfo: Joi.object({
    fullName: shortField.allow(""),
    email: Joi.string().email().trim().allow(""),
    phone: Joi.string().trim().pattern(/^\+?[0-9]{7,15}$/).allow(""),
    address: shortField.allow(""),
    linkedin: Joi.string().trim().uri().allow(""),
    github: Joi.string().trim().uri().allow(""),
    portfolio: Joi.string().trim().uri().allow(""),
  }).optional(),
  education: Joi.array().max(20).items(
    Joi.object({
      degree: shortField.allow(""),
      institution: shortField.allow(""),
      year: Joi.string().trim().max(12).allow(""),
      score: Joi.string().trim().max(20).allow(""),
    })
  ).optional(),
  skills: Joi.array().max(80).items(shortField.allow("")).optional(),
  projects: Joi.array().max(20).items(
    Joi.object({
      title: shortField.allow(""),
      description: textField.allow(""),
      technologies: Joi.string().trim().max(500).allow(""),
    })
  ).optional(),
  certifications: Joi.array().max(20).items(
    Joi.object({
      name: shortField.allow(""),
      issuedBy: shortField.allow(""),
      year: Joi.string().trim().max(12).allow(""),
    })
  ).optional(),
  profileSummary: textField.allow("").optional(),
  experienceLevel: Joi.string().trim().max(100).allow("").optional(),
})

const templateSelectionSchema = Joi.object({
  template: Joi.string().trim().valid("classic", "modern").required(),
})

const jobDescriptionSchema = Joi.object({
  jobDescription: Joi.string().trim().min(10).max(15000).required(),
})

const evaluateProjectSchema = Joi.object({
  projectTitle: Joi.string().trim().max(200).required(),
  projectDescription: Joi.string().trim().max(10000).allow(""),
  jobDescription: Joi.string().trim().min(10).max(15000).required(),
})

module.exports = {
  resumeSaveSchema,
  templateSelectionSchema,
  jobDescriptionSchema,
  evaluateProjectSchema,
}

