const { ROLES } = require("../constants/roles")

function buildCollegeScope(user) {
  if (!user) return {}
  if (user.role === ROLES.PLATFORM_ADMIN) {
    return {}
  }
  if (user.collegeId) return { collegeId: user.collegeId }
  return { _id: null }
}

function buildDepartmentScope(user) {
  if (!user) return {}
  if (user.role === ROLES.HOD && user.department) {
    return { department: user.department }
  }
  return {}
}

function assertCollegeAccess(actor, targetCollegeId) {
  if (!actor) return false
  if (actor.role === ROLES.PLATFORM_ADMIN) return true
  if (!actor.collegeId || !targetCollegeId) return false
  return String(actor.collegeId) === String(targetCollegeId)
}

module.exports = {
  buildCollegeScope,
  buildDepartmentScope,
  assertCollegeAccess,
}
