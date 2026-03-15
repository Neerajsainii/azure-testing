const assert = require("assert")
const path = require("path")
const svc = require(path.join(__dirname, "..", "services", "departmentCapacityService"))
const College = require(path.join(__dirname, "..", "models", "College"))
const Department = require(path.join(__dirname, "..", "models", "Department"))

const mockQuery = (result) => ({
  select: () => ({
    lean: async () => result
  })
})

async function run() {
  College.findById = (_id) => mockQuery({ departmentLimit: null })
  Department.countDocuments = async (_q) => 0
  {
    const cap = await svc.getCollegeDepartmentCapacity("c1")
    assert.strictEqual(cap.departmentLimit, null)
    assert.strictEqual(cap.departmentCount, 0)
    assert.strictEqual(cap.remainingDepartmentSlots, null)
  }

  College.findById = (_id) => mockQuery({ departmentLimit: 3 })
  Department.countDocuments = async (_q) => 2
  {
    const cap = await svc.getCollegeDepartmentCapacity("c2")
    assert.strictEqual(cap.departmentLimit, 3)
    assert.strictEqual(cap.departmentCount, 2)
    assert.strictEqual(cap.remainingDepartmentSlots, 1)
  }

  Department.countDocuments = async (_q) => 3
  try {
    await svc.assertDepartmentCapacity("c2")
    process.exitCode = 1
    console.error("Expected assertDepartmentCapacity to throw when limit reached")
    return
  } catch (e) {
    assert.strictEqual(e.code, "DEPARTMENT_LIMIT_REACHED")
    assert.strictEqual(e.statusCode, 409)
    assert.ok(e.details)
  }
  console.log("departmentCapacityService.test.js passed")
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
