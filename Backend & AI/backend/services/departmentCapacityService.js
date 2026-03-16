const College = require("../models/College")
const Department = require("../models/Department")

async function getCollegeDepartmentCapacity(collegeId) {
  if (!collegeId) {
    return {
      departmentLimit: null,
      departmentCount: 0,
      remainingDepartmentSlots: null,
    }
  }

  const [college, departmentCount] = await Promise.all([
    College.findById(collegeId).select("departmentLimit").lean(),
    Department.countDocuments({ collegeId }),
  ])

  const departmentLimit = college?.departmentLimit ?? null
  const remainingDepartmentSlots = departmentLimit === null
    ? null
    : Math.max(departmentLimit - departmentCount, 0)

  return {
    departmentLimit,
    departmentCount,
    remainingDepartmentSlots,
  }
}

async function assertDepartmentCapacity(collegeId) {
  const capacity = await getCollegeDepartmentCapacity(collegeId)
  const { departmentLimit, departmentCount } = capacity
  if (departmentLimit !== null && departmentCount >= departmentLimit) {
    const error = new Error("Department limit reached for this college")
    error.statusCode = 409
    error.code = "DEPARTMENT_LIMIT_REACHED"
    error.details = capacity
    throw error
  }
  return capacity
}

module.exports = {
  getCollegeDepartmentCapacity,
  assertDepartmentCapacity,
}
