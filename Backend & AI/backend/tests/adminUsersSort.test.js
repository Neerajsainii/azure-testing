const assert = require("assert")
const path = require("path")
const adminController = require(path.join(__dirname, "..", "controllers", "adminController"))
const User = require(path.join(__dirname, "..", "models", "User"))

async function run() {
  let capturedSort = null
  User.find = (q) => ({
    select() { return this },
    sort(s) { capturedSort = s; return Promise.resolve([]) }
  })
  const req = { query: { role: "all", sortBy: "role", order: "asc" } }
  const res = {
    status(code) { this.statusCode = code; return this },
    json(payload) { this.payload = payload }
  }
  await adminController.listUsers(req, res)
  assert.deepStrictEqual(capturedSort, { role: 1 })
  console.log("adminUsersSort.test.js passed")
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
