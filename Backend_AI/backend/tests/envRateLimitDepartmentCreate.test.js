const assert = require("assert")
const path = require("path")
const env = require(path.join(__dirname, "..", "config", "env")).env

assert.strictEqual(typeof env.rateLimitDepartmentCreateMax, "number")
assert.ok(env.rateLimitDepartmentCreateMax >= 1)
console.log("envRateLimitDepartmentCreate.test.js passed")
