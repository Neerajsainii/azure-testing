const Department = require("../models/Department")
const User = require("../models/User")
const PlacementDrive = require("../models/PlacementDrive")
const { ROLES } = require("../constants/roles")
async function buildPrincipalGraph({ collegeId, depth = 2 }) {
  const result = { nodes: {}, edges: [] }
  const principalKey = `principal:${collegeId}`
  result.nodes[principalKey] = { type: "principal", id: collegeId }
  const departments = await Department.find({ collegeId }).sort({ name: 1 }).lean()
  for (const d of departments) {
    const dk = `department:${String(d._id)}`
    result.nodes[dk] = {
      type: "department",
      id: String(d._id),
      name: d.name,
      hodName: d.hodName || "",
    }
    result.edges.push([principalKey, dk, "has_department"])
  }
  if (depth < 1) return result
  const staff = await User.find({
    collegeId,
    role: { $in: [ROLES.HOD, ROLES.PLACEMENT_OFFICER] },
  })
    .select("name email role department collegeId")
    .lean()
  for (const u of staff) {
    const uk = `user:${String(u._id)}`
    result.nodes[uk] = {
      type: "user",
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department || null,
    }
    result.edges.push([principalKey, uk, "has_staff"])
    if (u.department) {
      const dk = Object.keys(result.nodes).find(
        (k) => result.nodes[k].type === "department" && result.nodes[k].name === u.department
      )
      if (dk) result.edges.push([uk, dk, "assigned_to"])
    }
  }
  if (depth < 2) return result
  const studentsByDept = await User.aggregate([
    { $match: { role: ROLES.STUDENT, collegeId } },
    { $group: { _id: "$department", total: { $sum: 1 }, avgCGPA: { $avg: "$cgpa" } } },
  ])
  const lookup = {}
  for (const s of studentsByDept) lookup[s._id || ""] = s
  for (const k of Object.keys(result.nodes)) {
    const n = result.nodes[k]
    if (n.type === "department") {
      const s = lookup[n.name]
      n.totalStudents = s ? s.total : 0
      n.avgCGPA = s ? s.avgCGPA : 0
    }
  }
  const drives = await PlacementDrive.find({
    collegeId,
    deletedAt: null,
    status: { $in: ["draft", "open"] },
  })
    .select("company eligibility status createdAt")
    .lean()
  for (const drv of drives) {
    const dk = `drive:${String(drv._id)}`
    result.nodes[dk] = {
      type: "drive",
      id: String(drv._id),
      company: drv.company || "",
      status: drv.status,
      createdAt: drv.createdAt,
    }
    result.edges.push([principalKey, dk, "has_drive"])
    const allowed = Array.isArray(drv?.eligibility?.allowedDepartments) ? drv.eligibility.allowedDepartments : []
    for (const deptName of allowed) {
      const deptKey = Object.keys(result.nodes).find(
        (k) => result.nodes[k].type === "department" && result.nodes[k].name === deptName
      )
      if (deptKey) result.edges.push([dk, deptKey, "eligible_for"])
    }
  }
  return result
}
module.exports = { buildPrincipalGraph }
