/**
 * College Hard-Delete Cascade Service
 *
 * Permanently removes a college and ALL associated data from the database.
 * Deletion order respects referential dependencies:
 *   1. Collect all userIds and driveIds belonging to the college
 *   2. Delete leaf-level records first (DriveCandidate, CompanyShortlist, Resume, AIresults, DownloadUsage, RevokedToken)
 *   3. Delete mid-level records (PlacementDrive, Company, Invitation, StudentAcademicProfile, PlacementNotification, ReportApproval)
 *   4. Delete top-level records (User, Department)
 *   5. Finally delete the College document itself
 */

const College = require("../models/College");
const Department = require("../models/Department");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const PlacementDrive = require("../models/PlacementDrive");
const DriveCandidate = require("../models/DriveCandidate");
const PlacementNotification = require("../models/PlacementNotification");
const ReportApproval = require("../models/ReportApproval");
const StudentAcademicProfile = require("../models/StudentAcademicProfile");
const Company = require("../models/Company");
const CompanyShortlist = require("../models/CompanyShortlist");
const Resume = require("../models/Resume");
const AIResult = require("../models/AIresults");
const DownloadUsage = require("../models/DownloadUsage");
const RevokedToken = require("../models/RevokedToken");
const { logger } = require("../utils/logger");

/**
 * Permanently deletes a college and all its related data.
 * @param {string|ObjectId} collegeId
 * @param {object} [options]
 * @param {object} [options.actor] - User performing the action (for logging)
 * @returns {Promise<object>} summary of deleted counts per collection
 */
async function hardDeleteCollege(collegeId, options = {}) {
    const { actor } = options;

    // --- Step 1: Verify college exists ---
    const college = await College.findById(collegeId).lean();
    if (!college) {
        const err = new Error("College not found");
        err.statusCode = 404;
        throw err;
    }

    const summary = {
        collegeName: college.name,
        collegeId: String(collegeId),
    };

    logger.info("college_hard_delete_start", {
        collegeId: String(collegeId),
        collegeName: college.name,
        actorId: actor?._id?.toString() || null,
    });

    // --- Step 2: Collect referenced IDs ---
    const collegUsers = await User.find({ collegeId }).select("_id").lean();
    const userIds = collegUsers.map((u) => u._id);

    const collegeDrives = await PlacementDrive.find({ collegeId }).select("_id").lean();
    const driveIds = collegeDrives.map((d) => d._id);

    // --- Step 3: Delete leaf-level per-user data ---
    const [resumeRes, aiRes, downloadRes, revokedRes] = await Promise.all([
        userIds.length > 0 ? Resume.deleteMany({ userId: { $in: userIds } }) : Promise.resolve({ deletedCount: 0 }),
        userIds.length > 0 ? AIResult.deleteMany({ userId: { $in: userIds } }) : Promise.resolve({ deletedCount: 0 }),
        userIds.length > 0 ? DownloadUsage.deleteMany({ userId: { $in: userIds } }) : Promise.resolve({ deletedCount: 0 }),
        userIds.length > 0 ? RevokedToken.deleteMany({ userId: { $in: userIds } }) : Promise.resolve({ deletedCount: 0 }),
    ]);

    summary.resumes = resumeRes.deletedCount;
    summary.aiResults = aiRes.deletedCount;
    summary.downloadUsage = downloadRes.deletedCount;
    summary.revokedTokens = revokedRes.deletedCount;

    // --- Step 4: Delete CompanyShortlist per studentId ---
    const companyShortlistRes = userIds.length > 0
        ? await CompanyShortlist.deleteMany({ studentId: { $in: userIds } })
        : { deletedCount: 0 };
    summary.companyShortlists = companyShortlistRes.deletedCount;

    // --- Step 5: Delete drive candidates for college's drives ---
    const driveCandidateRes = driveIds.length > 0
        ? await DriveCandidate.deleteMany({ driveId: { $in: driveIds } })
        : { deletedCount: 0 };
    summary.driveCandidates = driveCandidateRes.deletedCount;

    // --- Step 6: Delete college-scoped records ---
    const [
        driveRes,
        companyRes,
        invitationRes,
        academicProfileRes,
        notificationRes,
        reportApprovalRes,
    ] = await Promise.all([
        PlacementDrive.deleteMany({ collegeId }),
        Company.deleteMany({ collegeId }),
        Invitation.deleteMany({ collegeId }),
        StudentAcademicProfile.deleteMany({ collegeId }),
        PlacementNotification.deleteMany({ collegeId }),
        ReportApproval.deleteMany({ collegeId }),
    ]);

    summary.placementDrives = driveRes.deletedCount;
    summary.companies = companyRes.deletedCount;
    summary.invitations = invitationRes.deletedCount;
    summary.academicProfiles = academicProfileRes.deletedCount;
    summary.placementNotifications = notificationRes.deletedCount;
    summary.reportApprovals = reportApprovalRes.deletedCount;

    // --- Step 7: Delete Users and Departments ---
    const [userRes, deptRes] = await Promise.all([
        User.deleteMany({ collegeId }),
        Department.deleteMany({ collegeId }),
    ]);

    summary.users = userRes.deletedCount;
    summary.departments = deptRes.deletedCount;

    // --- Step 8: Finally delete the College itself ---
    await College.deleteOne({ _id: collegeId });
    summary.colleges = 1;

    logger.info("college_hard_delete_complete", {
        collegeId: String(collegeId),
        collegeName: college.name,
        actorId: actor?._id?.toString() || null,
        summary,
    });

    return summary;
}

module.exports = { hardDeleteCollege };
