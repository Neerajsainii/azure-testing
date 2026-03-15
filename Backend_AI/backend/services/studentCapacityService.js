const College = require("../models/College")
const User = require("../models/User")
const { ROLES } = require("../constants/roles")

/**
 * Returns student capacity info for a college.
 * @param {string|ObjectId} collegeId
 */
async function getCollegeStudentCapacity(collegeId) {
    if (!collegeId) {
        return {
            studentLimit: null,
            studentCount: 0,
            remainingStudentSlots: null,
        }
    }

    const [college, studentCount] = await Promise.all([
        College.findById(collegeId).select("studentLimit").lean(),
        User.countDocuments({ collegeId, role: ROLES.STUDENT }),
    ])

    const studentLimit = college?.studentLimit ?? null
    const remainingStudentSlots = studentLimit === null
        ? null
        : Math.max(studentLimit - studentCount, 0)

    return {
        studentLimit,
        studentCount,
        remainingStudentSlots,
    }
}

/**
 * Throws a 409 error if the college has reached its student limit.
 * @param {string|ObjectId} collegeId
 */
async function assertStudentCapacity(collegeId) {
    const capacity = await getCollegeStudentCapacity(collegeId)
    const { studentLimit, studentCount } = capacity
    if (studentLimit !== null && studentCount >= studentLimit) {
        const error = new Error("Student limit reached for this college")
        error.statusCode = 409
        error.code = "STUDENT_LIMIT_REACHED"
        error.details = capacity
        throw error
    }
    return capacity
}

module.exports = {
    getCollegeStudentCapacity,
    assertStudentCapacity,
}
