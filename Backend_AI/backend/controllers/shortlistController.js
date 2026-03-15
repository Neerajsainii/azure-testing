const mongoose = require("mongoose");
const Company = require("../models/Company");
const CompanyShortlist = require("../models/CompanyShortlist");
const { runAutoShortlist } = require("../services/autoShortlistService");
const logAudit = require("../utils/auditLogger");
const { ROLES } = require("../constants/roles")
const { logger } = require("../utils/logger")

// Run Auto-Shortlist
exports.runShortlist = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId).session(session);
    if (!company) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Company not found" });
    }

    // Determine restriction
    // Platform admin and principal can shortlist across all departments.
    // Placement officer is restricted to UG scope.
    const isPlatformAdmin = [ROLES.PLATFORM_ADMIN, ROLES.PRINCIPAL].includes(req.user.role);
    const restrictToUG = !isPlatformAdmin; 

    // 1. Run Logic
    const eligibleStudents = await runAutoShortlist(companyId, restrictToUG, req.user);

    // 2. Delete old shortlist
    await CompanyShortlist.deleteMany({ companyId }).session(session);

    // 3. Save new results
    if (eligibleStudents.length > 0) {
      const shortlistEntries = eligibleStudents.map((student) => ({
        companyId,
        studentId: student._id,
        atsScore: student.atsScore,
        jobMatchScore: student.jobMatchScore
      }));
      await CompanyShortlist.insertMany(shortlistEntries, { session });
    }

    await logAudit(req.user, "AUTO_SHORTLIST_RUN", "company", companyId, req);

    await session.commitTransaction();
    session.endSession();

    const response = {
      company: company.name,
      shortlistedCount: eligibleStudents.length,
      criteriaUsed: company.criteria
    };

    if (eligibleStudents.length === 0) {
      response.message = "No eligible students matched the criteria";
    }

    res.json(response);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error("shortlist_run_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get Shortlist
exports.getShortlist = async (req, res) => {
  try {
    const companyId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const total = await CompanyShortlist.countDocuments({ companyId });

    const shortlist = await CompanyShortlist.find({ companyId })
      .populate("studentId", "name department batch")
      .sort({ jobMatchScore: -1, atsScore: -1 })
      .skip(skip)
      .limit(limit);

    // Log only once per session or if explicit logging is required (refined requirement)
    // Requirement says: "VIEW_COMPANIES → log only once per session" 
    // but for shortlist view "AUTO_SHORTLIST_VIEW" precision: "Add metadata: companyId, shortlistCount, criteriaSnapshot (optional)"
    await logAudit(req.user, "AUTO_SHORTLIST_VIEW", "company", companyId, req);

    // Format output
    const formattedList = shortlist.map((entry) => {
        const student = entry.studentId;
        if (!student) return null; 
        
        return {
            id: student._id,
            name: student.name,
            department: student.department,
            batch: student.batch,
            atsScore: entry.atsScore,
            jobMatchScore: entry.jobMatchScore,
            jobReady: entry.jobMatchScore >= 70 // Example threshold
        };
    }).filter(item => item !== null);

    res.json({
      count: total,
      page,
      limit,
      results: formattedList
    });
  } catch (error) {
    logger.error("shortlist_get_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ message: "Server Error" });
  }
};
