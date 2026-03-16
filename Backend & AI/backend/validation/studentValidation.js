const Joi = require("joi")

const profileUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  department: Joi.string().trim().max(100).allow(""),
  year: Joi.number().integer().min(1).max(8).allow(""),
  phone: Joi.string().trim().pattern(/^\+?[0-9]{7,15}$/).allow(""),
  college: Joi.string().trim().max(150).allow(""),
  profile_photo: Joi.string().trim().allow(""),
  address: Joi.string().trim().allow(""),
  linkedin: Joi.string().trim().allow(""),
  github: Joi.string().trim().allow(""),
  portfolio: Joi.string().trim().allow(""),
  section: Joi.string().trim().max(20).allow(""),
  cgpa: Joi.number().min(0).max(10),
  percentage10: Joi.number().min(0).max(100),
  percentage12: Joi.number().min(0).max(100),
  backlogsCount: Joi.number().integer().min(0).max(50),
  gapYears: Joi.number().integer().min(0).max(20),
  attendancePercent: Joi.number().min(0).max(100),
  skills: Joi.array().max(100).items(Joi.string().trim().max(80)),
  batch: Joi.string().trim().max(20).allow(""),
}).min(1)

module.exports = {
  profileUpdateSchema,
}

