const Joi = require("joi")

const createContactQuerySchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().trim().lowercase().max(254).required(),
  college: Joi.string().trim().max(150).allow("", null),
  message: Joi.string().trim().min(1).max(4000).required(),
})

module.exports = { createContactQuerySchema }

