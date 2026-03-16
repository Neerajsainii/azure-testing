const assert = require("assert")
const path = require("path")
const adminController = require(path.join(__dirname, "..", "controllers", "adminController"))
const mongoose = require("mongoose")

async function run() {
  const originalState = mongoose.connection.readyState
  mongoose.connection.readyState = 0
  const req = { body: { name: "Test College" } }
  const res = {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.payload = payload }
  }
  await adminController.createCollege(req, res)
  assert.strictEqual(res.statusCode, 503)
  assert.strictEqual(res.payload.code, "DB_UNAVAILABLE")
  mongoose.connection.readyState = originalState
  console.log("adminCreateCollegeDbDown.test.js passed")
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
