const Joi = require("joi");

const companyValidation = {
  createCompany: Joi.object({
    name: Joi.string().required().trim(),
    description: Joi.string().allow("").default(""),
    criteria: Joi.object({
      minAtsScore: Joi.number().min(0).default(0),
      minJobMatchScore: Joi.number().min(0).default(0),
      allowedDepartments: Joi.array().items(Joi.string()).default([]),
      allowedBatches: Joi.array().items(Joi.string()).default([]),
      minResumeCompletion: Joi.number().min(0).max(100).default(100),
      requiredSkills: Joi.array().items(Joi.string()).default([]),
      minPercentage10: Joi.number().min(0).max(100).default(0),
      minPercentage12: Joi.number().min(0).max(100).default(0),
      maxBacklogs: Joi.number().min(0).default(99),
      maxGapYears: Joi.number().min(0).default(99),
      minAttendancePercent: Joi.number().min(0).max(100).default(0),
    }).default({})
  }),

  runShortlist: Joi.object({
    // Add any specific parameters if needed for the run endpoint body
    // Currently it takes parameters from URL and uses default logic
  })
};

module.exports = companyValidation;
