const Joi = require("joi")

const inviteStudentSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  name: Joi.string().trim().max(120).allow("", null),
  department: Joi.string().trim().max(120).allow("", null),
  year: Joi.number().integer().min(1).max(8).allow(null),
  batch: Joi.string().trim().max(20).allow("", null),
  rollNo: Joi.string().trim().max(50).allow("", null),
})

const bulkImportSchema = Joi.object({
  fileName: Joi.string().trim().max(255).allow("", null),
  fileMimeType: Joi.string()
    .trim()
    .lowercase()
    .valid(
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    .allow("", null),
  fileBase64: Joi.string().trim().max(8 * 1024 * 1024).required(),
})

const listInvitesQuerySchema = Joi.object({
  status: Joi.string().trim().valid("pending", "invited", "accepted", "revoked", "expired").optional(),
})

module.exports = {
  inviteStudentSchema,
  bulkImportSchema,
  listInvitesQuerySchema,
}
