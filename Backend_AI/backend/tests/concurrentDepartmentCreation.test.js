const assert = require("assert")
const path = require("path")
const svc = require(path.join(__dirname, "..", "services", "departmentCapacityService"))
const College = require(path.join(__dirname, "..", "models", "College"))
const Department = require(path.join(__dirname, "..", "models", "Department"))

async function run() {
  const runDb = ["1", "true", "yes"].includes(String(process.env.RUN_DB_TESTS || "").toLowerCase())
  if (!runDb) {
    console.log("concurrentDepartmentCreation.test.js skipped (set RUN_DB_TESTS=1 to enable)")
    return
  }

  let count = 0
  College.findById = async (_id) => ({ departmentLimit: 5 })
  Department.countDocuments = async (_q) => count

  const tasks = Array.from({ length: 10 }).map(async () => {
    try {
      await svc.assertDepartmentCapacity("c3")
      count++
      return true
    } catch (e) {
      return false
    }
  })

  const results = await Promise.all(tasks)
  const success = results.filter(Boolean).length
  const failures = results.length - success
  assert.strictEqual(success, 5)
  assert.strictEqual(failures, 5)
  console.log("concurrentDepartmentCreation.test.js passed")
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
