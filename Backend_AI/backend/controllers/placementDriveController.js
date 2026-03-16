const PlacementDrive = require("../models/PlacementDrive")
const DriveCandidate = require("../models/DriveCandidate")
const User = require("../models/User")
const { createDrive, updateDrive, recomputeDriveCandidates, findEligibleStudentsForJob } = require("../services/driveService")
const { assertCollegeAccess, buildCollegeScope } = require("../utils/accessScope")
const { logger } = require("../utils/logger")

async function getDriveForActor(driveId, actor) {
  const drive = await PlacementDrive.findById(driveId)
  if (!drive || drive.deletedAt) return null
  if (!assertCollegeAccess(actor, drive.collegeId)) return null
  return drive
}

exports.createPlacementDrive = async (req, res) => {
  try {
    if (!req.user?.collegeId) {
      return res.status(400).json({ message: "User college mapping required" })
    }
    const result = await createDrive(req.body || {}, req.user)
    return res.status(201).json({
      drive: result.drive,
      shortlistedCount: result.recompute.shortlistedCount,
    })
  } catch (error) {
    logger.error("placement_drive_create_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(500).json({ message: "Failed to create drive" })
  }
}

exports.listPlacementDrives = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = { ...buildCollegeScope(req.user), deletedAt: null }
    if (status) filter.status = status

    const drives = await PlacementDrive.find(filter)
      .populate("companyId", "name")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean()

    // Count applicants per drive from DriveCandidate collection
    const driveIds = drives.map((d) => d._id)
    const candidateCounts = await DriveCandidate.aggregate([
      { $match: { driveId: { $in: driveIds } } },
      { $group: { _id: "$driveId", count: { $sum: 1 } } },
    ])
    const countMap = {}
    for (const c of candidateCounts) {
      countMap[String(c._id)] = c.count
    }

    return res.json({
      count: drives.length,
      drives: drives.map((d) => ({
        _id: d._id,
        id: d._id,
        title: d.title,
        company: d.companyId?.name || "Unknown",
        companyId: d.companyId?._id || d.companyId || null,
        companyDescription: d.companyDescription,
        postedDate: d.createdAt,
        status: d.status === "closed" ? "closed" : "open",
        criteria: d.eligibility,
        applicants: countMap[String(d._id)] || 0,
      })),
    })
  } catch (error) {
    logger.error("placement_drive_list_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(500).json({ message: "Failed to fetch drives" })
  }
}

exports.getPlacementDrive = async (req, res) => {
  try {
    const drive = await getDriveForActor(req.params.id, req.user)
    if (!drive) return res.status(404).json({ message: "Drive not found" })
    return res.json(drive)
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch drive" })
  }
}

exports.updatePlacementDrive = async (req, res) => {
  try {
    const drive = await getDriveForActor(req.params.id, req.user)
    if (!drive) return res.status(404).json({ message: "Drive not found" })
    const result = await updateDrive(drive, req.body || {})
    return res.json({
      drive: result.drive,
      shortlistedCount: result.recompute.shortlistedCount,
    })
  } catch (error) {
    logger.error("placement_drive_update_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(500).json({ message: "Failed to update drive" })
  }
}

exports.updatePlacementDriveStatus = async (req, res) => {
  try {
    const drive = await getDriveForActor(req.params.id, req.user)
    if (!drive) return res.status(404).json({ message: "Drive not found" })
    drive.status = req.body?.status || drive.status
    await drive.save()
    return res.json({ message: "Drive status updated", drive })
  } catch (error) {
    return res.status(500).json({ message: "Failed to update status" })
  }
}

exports.deletePlacementDrive = async (req, res) => {
  try {
    const drive = await getDriveForActor(req.params.id, req.user)
    if (!drive) return res.status(404).json({ message: "Drive not found" })
    drive.deletedAt = new Date()
    drive.status = "archived"
    await drive.save()
    return res.json({ message: "Drive archived" })
  } catch (error) {
    return res.status(500).json({ message: "Failed to archive drive" })
  }
}

exports.recomputeDriveEligibility = async (req, res) => {
  try {
    const drive = await getDriveForActor(req.params.id, req.user)
    if (!drive) return res.status(404).json({ message: "Drive not found" })
    const result = await recomputeDriveCandidates(drive)
    return res.json({ message: "Eligibility recomputed", shortlistedCount: result.shortlistedCount })
  } catch (error) {
    logger.error("placement_drive_recompute_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(500).json({ message: "Failed to recompute eligibility" })
  }
}

exports.getDriveCandidates = async (req, res) => {
  try {
    const drive = await getDriveForActor(req.params.id, req.user)
    if (!drive) return res.status(404).json({ message: "Drive not found" })

    const { page = 1, limit = 50, finalStatus } = req.query
    const filter = { driveId: drive._id }
    if (finalStatus) filter.finalStatus = finalStatus

    const rows = await DriveCandidate.find(filter)
      .populate("studentId", "name email department year cgpa placementStatus")
      .sort({ updatedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean()

    return res.json({
      count: rows.length,
      candidates: rows.map((r) => ({
        id: r.studentId?._id || r.studentId,
        name: r.studentId?.name || "Unknown",
        email: r.studentId?.email || "",
        department: r.studentId?.department || r.department || "",
        year: r.studentId?.year || null,
        cgpa: r.studentId?.cgpa || 0,
        eligibilityReason: r.eligibilityReason,
        roundStatus: r.roundStatus,
        finalStatus: r.finalStatus,
        packageOffered: r.packageOffered,
        offerDate: r.offerDate,
        remarks: r.remarks,
      })),
    })
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch candidates" })
  }
}

exports.updateDriveCandidateRoundStatus = async (req, res) => {
  try {
    const drive = await getDriveForActor(req.params.id, req.user)
    if (!drive) return res.status(404).json({ message: "Drive not found" })
    const { studentId } = req.params
    const { aptitude, gd, interview } = req.body || {}

    const update = {}
    if (aptitude) update["roundStatus.aptitude"] = aptitude
    if (gd) update["roundStatus.gd"] = gd
    if (interview) update["roundStatus.interview"] = interview

    const row = await DriveCandidate.findOneAndUpdate(
      { driveId: drive._id, studentId },
      { $set: update },
      { new: true }
    )
    if (!row) return res.status(404).json({ message: "Candidate not found for drive" })
    return res.json({ message: "Round status updated", candidate: row })
  } catch (error) {
    return res.status(500).json({ message: "Failed to update round status" })
  }
}

exports.updateDriveCandidateFinalStatus = async (req, res) => {
  try {
    const drive = await getDriveForActor(req.params.id, req.user)
    if (!drive) return res.status(404).json({ message: "Drive not found" })
    const { studentId } = req.params
    const { finalStatus, remarks } = req.body || {}
    const row = await DriveCandidate.findOneAndUpdate(
      { driveId: drive._id, studentId },
      { $set: { finalStatus, ...(remarks !== undefined ? { remarks } : {}) } },
      { new: true }
    )
    if (!row) return res.status(404).json({ message: "Candidate not found for drive" })

    if (["offered", "joined"].includes(finalStatus)) {
      await User.findByIdAndUpdate(studentId, { placementStatus: "placed" })
    } else {
      // Check if student has any other "offered" or "joined" statuses in other drives
      const otherOffers = await DriveCandidate.countDocuments({
        studentId,
        finalStatus: { $in: ["offered", "joined"] },
      })
      if (otherOffers === 0) {
        // If no other offers exist, revert them to applying/available
        const anyApplications = await DriveCandidate.countDocuments({ studentId })
        const newStatus = anyApplications > 0 ? "applying" : "available"
        await User.findByIdAndUpdate(studentId, { placementStatus: newStatus })
      }
    }
    return res.json({ message: "Final status updated", candidate: row })
  } catch (error) {
    return res.status(500).json({ message: "Failed to update final status" })
  }
}

exports.updateDriveCandidateOffer = async (req, res) => {
  try {
    const drive = await getDriveForActor(req.params.id, req.user)
    if (!drive) return res.status(404).json({ message: "Drive not found" })
    const { studentId } = req.params
    const { packageOffered, offerDate, remarks } = req.body || {}

    // If packageOffered is null/removed, revert finalStatus to shortlisted (unless they explicitly declined)
    const newFinalStatus = packageOffered ? "offered" : "shortlisted"

    const row = await DriveCandidate.findOneAndUpdate(
      { driveId: drive._id, studentId },
      {
        $set: {
          packageOffered: packageOffered ?? null,
          offerDate: offerDate ? new Date(offerDate) : null,
          finalStatus: newFinalStatus,
          ...(remarks !== undefined ? { remarks } : {}),
        },
      },
      { new: true }
    )
    if (!row) return res.status(404).json({ message: "Candidate not found for drive" })

    if (newFinalStatus === "offered") {
      await User.findByIdAndUpdate(studentId, { placementStatus: "placed" })
    } else {
      const otherOffers = await DriveCandidate.countDocuments({
        studentId,
        finalStatus: { $in: ["offered", "joined"] },
      })
      if (otherOffers === 0) {
        const anyApplications = await DriveCandidate.countDocuments({ studentId })
        const newStatus = anyApplications > 0 ? "applying" : "available"
        await User.findByIdAndUpdate(studentId, { placementStatus: newStatus })
      }
    }
    return res.json({ message: "Offer updated", candidate: row })
  } catch (error) {
    return res.status(500).json({ message: "Failed to update offer" })
  }
}

exports.getPlacementStats = async (req, res) => {
  try {
    const collegeScope = buildCollegeScope(req.user)
    const [drives, candidates] = await Promise.all([
      PlacementDrive.countDocuments({ ...collegeScope, deletedAt: null }),
      DriveCandidate.aggregate([
        { $match: collegeScope },
        { $group: { _id: "$finalStatus", count: { $sum: 1 } } },
      ]),
    ])
    return res.json({ totalDrives: drives, statusBreakdown: candidates })
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch placement stats" })
  }
}

exports.matchJobCandidates = async (req, res) => {
  try {
    const { jobDescription } = req.body
    if (!jobDescription) {
      return res.status(400).json({ message: "Job description is required" })
    }

    const collegeId = req.user.collegeId
    if (!collegeId) {
      return res.status(400).json({ message: "College context required" })
    }

    // Call service to find matching candidates
    // This function needs to be implemented in driveService.js
    const result = await findEligibleStudentsForJob(collegeId, jobDescription)

    logger.info("job_candidate_match_completed", { collegeId: String(collegeId), count: result.length })
    return res.json({
      count: result.length,
      candidates: result
    })
  } catch (error) {
    logger.error("job_candidate_match_failed", { message: error.message })
    return res.status(500).json({ message: "Failed to match candidates" })
  }
}

exports.getOpenings = async (req, res) => {
  try {
    const filter = { ...buildCollegeScope(req.user), deletedAt: null }
    const drives = await PlacementDrive.find(filter)
      .populate("companyId", "name")
      .sort({ createdAt: -1 })
      .lean()

    return res.json({
      count: drives.length,
      drives: drives.map((d) => ({
        _id: d._id,
        id: d._id,
        title: d.title,
        company: d.companyId?.name || "Unknown",
        companyId: d.companyId?._id || d.companyId || null,
        companyDescription: d.companyDescription,
        postedDate: d.createdAt,
        status: d.status === "closed" ? "closed" : "open",
        criteria: d.eligibility,
      })),
    })
  } catch (error) {
    logger.error("student_openings_fetch_failed", { message: error.message, requestId: req.requestId || null })
    res.status(500).json({ message: "Failed to fetch openings" })
  }
}
