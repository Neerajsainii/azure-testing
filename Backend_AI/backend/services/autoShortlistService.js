const User = require("../models/User");
const Company = require("../models/Company");
const { ROLES } = require("../constants/roles")

/**
 * Service to run auto-shortlisting for a company
 * @param {String} companyId - The ID of the company
 * @param {Boolean} restrictToUG - Whether to restrict to UG students only (default false)
 * @param {Object} actor - Request user used for college scoping
 * @returns {Promise<Array>} - List of shortlisted student objects (User + Resume subset)
 */
const runAutoShortlist = async (companyId, restrictToUG = false, actor = null) => {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error("Company not found");
  }

  const {
    minAtsScore,
    minJobMatchScore,
    allowedDepartments,
    allowedBatches,
    minResumeCompletion,
    requiredSkills
  } = company.criteria;

  // Build Aggregation Pipeline
  const pipeline = [];

  // 1. Match Students
  const matchStage = {
    role: ROLES.STUDENT,
    status: "active" // Only active students
  };
  if (actor?.collegeId) {
    matchStage.collegeId = actor.collegeId
  }

  // Apply UG restriction if required
  if (restrictToUG) {
    matchStage.departmentType = "UG";
  }

  // Filter by Batch (if specified in criteria)
  if (allowedBatches && allowedBatches.length > 0) {
    matchStage.batch = { $in: allowedBatches };
  }

  // Filter by Department (if specified in criteria)
  if (allowedDepartments && allowedDepartments.length > 0) {
    matchStage.department = { $in: allowedDepartments };
  }

  pipeline.push({ $match: matchStage });

  // 2. Lookup Resume
  pipeline.push({
    $lookup: {
      from: "resumes",
      localField: "_id",
      foreignField: "userId",
      as: "resume"
    }
  });

  // 3. Unwind Resume (Exclude students without resume)
  pipeline.push({ $unwind: "$resume" });
  pipeline.push({
    $lookup: {
      from: "studentacademicprofiles",
      localField: "_id",
      foreignField: "userId",
      as: "academicProfile",
    },
  })
  pipeline.push({
    $unwind: {
      path: "$academicProfile",
      preserveNullAndEmptyArrays: true,
    },
  })

  // 4. Apply Resume-based Filters
  const resumeMatch = {
    "resume.resumeCompletion": { $gte: minResumeCompletion || 0 },
    "resume.atsScore": { $gte: minAtsScore || 0 },
    "resume.jobMatchScore": { $gte: minJobMatchScore || 0 }
  };
  if (typeof company.criteria?.minPercentage10 === "number") {
    resumeMatch["academicProfile.percentage10"] = { $gte: company.criteria.minPercentage10 }
  }
  if (typeof company.criteria?.minPercentage12 === "number") {
    resumeMatch["academicProfile.percentage12"] = { $gte: company.criteria.minPercentage12 }
  }
  if (typeof company.criteria?.maxBacklogs === "number") {
    resumeMatch["academicProfile.backlogsCount"] = { $lte: company.criteria.maxBacklogs }
  }
  if (typeof company.criteria?.maxGapYears === "number") {
    resumeMatch["academicProfile.gapYears"] = { $lte: company.criteria.maxGapYears }
  }
  if (typeof company.criteria?.minAttendancePercent === "number") {
    resumeMatch["academicProfile.attendancePercent"] = { $gte: company.criteria.minAttendancePercent }
  }

  // Filter by Skills (if specified)
  // We check if 'resume.skills' contains all 'requiredSkills'
  if (requiredSkills && requiredSkills.length > 0) {
    // We can use $setIsSubset to check if requiredSkills is a subset of resume.skills
    // But since we are in $match, we can't use aggregation operators directly on the field easily without $expr
    // Using $expr for skills matching
    resumeMatch.$expr = {
      $setIsSubset: [requiredSkills, "$resume.skills"]
    };
  }

  pipeline.push({ $match: resumeMatch });

  // 5. Project needed fields
  pipeline.push({
    $project: {
      _id: 1,
      name: 1,
      department: 1,
      batch: 1,
      departmentType: 1,
      percentage10: "$academicProfile.percentage10",
      percentage12: "$academicProfile.percentage12",
      backlogsCount: "$academicProfile.backlogsCount",
      gapYears: "$academicProfile.gapYears",
      attendancePercent: "$academicProfile.attendancePercent",
      atsScore: "$resume.atsScore",
      jobMatchScore: "$resume.jobMatchScore",
      jobReady: {
        $cond: {
          if: { $gte: ["$resume.jobMatchScore", 70] }, // Example threshold for jobReady
          then: true,
          else: false
        }
      }
    }
  });

  const students = await User.aggregate(pipeline);
  return students;
};

module.exports = {
  runAutoShortlist
};
