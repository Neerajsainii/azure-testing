const Joi = require("joi")

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/
const TOTP_PATTERN = /^\d{6}$/

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().pattern(PASSWORD_PATTERN).required(),
  collegeName: Joi.string().trim().max(150).allow("", null),
  mobileNumber: Joi.string().trim().pattern(/^\+?[0-9]{7,15}$/).allow("", null),
  department: Joi.string().trim().max(100).allow("", null),
  year: Joi.number().integer().min(1).max(8).allow(null),
  batch: Joi.string().trim().max(20).allow("", null),
})

const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).max(128).required(),
  loginIntent: Joi.string().trim().valid("student", "administration", "main").required(),
  selectedRole: Joi.string().trim().valid("principal", "hod", "placement_officer").allow("", null),
})

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  otp: Joi.string().trim().pattern(TOTP_PATTERN).required(),
})

const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
})

const requestEmailVerificationSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
})

const confirmPasswordResetSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  otp: Joi.string().trim().pattern(TOTP_PATTERN).required(),
  newPassword: Joi.string().pattern(PASSWORD_PATTERN).required(),
})

module.exports = {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  requestPasswordResetSchema,
  requestEmailVerificationSchema,
  confirmPasswordResetSchema,
  inviteActivationSchema: Joi.object({
    email: Joi.string().email().trim().lowercase().required(),
    newPassword: Joi.string().pattern(PASSWORD_PATTERN).required(),
    token: Joi.string().required(),
  }),
}
