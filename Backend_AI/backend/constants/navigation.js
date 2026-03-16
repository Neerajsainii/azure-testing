const { ROLES } = require("./roles")

const DASHBOARD_REDIRECTS = Object.freeze({
  [ROLES.PLATFORM_ADMIN]: "/admin-dashboard",
  [ROLES.PRINCIPAL]: "/principal-dashboard",
  [ROLES.PLACEMENT_OFFICER]: "/placement-dashboard",
  [ROLES.HOD]: "/hod-dashboard",
  [ROLES.STUDENT]: "/student-dashboard",
  [ROLES.STANDALONE_STUDENT]: "/standalone/dashboard",
})

const ALLOWED_BASE_PATHS = Object.freeze({
  [ROLES.PLATFORM_ADMIN]: ["/admin-dashboard", "/admin"],
  [ROLES.PRINCIPAL]: ["/principal-dashboard", "/principal"],
  [ROLES.PLACEMENT_OFFICER]: ["/placement-dashboard", "/placement"],
  [ROLES.HOD]: ["/hod-dashboard", "/hod"],
  [ROLES.STUDENT]: ["/student-dashboard", "/student"],
  [ROLES.STANDALONE_STUDENT]: ["/standalone/dashboard", "/student-dashboard", "/student", "/standalone"],
})

module.exports = {
  DASHBOARD_REDIRECTS,
  ALLOWED_BASE_PATHS,
}
