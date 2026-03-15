const Joi = require("joi");

const validationOptions = {
  abortEarly: false,
  convert: true,
  stripUnknown: true,
  allowUnknown: false,
}

function applyValidation(schema, value) {
  const { error, value: sanitized } = schema.validate(value, validationOptions)
  return { error, value: sanitized }
}

const validate = (schema) => (req, res, next) => {
  const schemaMap = schema && typeof schema.validate === "function"
    ? { body: schema }
    : schema

  const details = []

  for (const part of ["body", "query", "params"]) {
    const partSchema = schemaMap?.[part]
    if (!partSchema) continue

    const { error, value } = applyValidation(partSchema, req[part])
    if (error) {
      details.push(
        ...error.details.map((d) => ({
          ...d,
          message: d.message,
          path: [part, ...d.path],
        }))
      )
    } else {
      req[part] = value
    }
  }

  if (details.length > 0) {
    const err = new Error("Validation failed")
    err.statusCode = 400
    err.code = "VALIDATION_ERROR"
    err.details = details
    return next(err)
  }

  next();
};

module.exports = validate;
