const User = require("../models/User");
const logAudit = require("../utils/auditLogger");
const { ROLES } = require("../constants/roles")

const REPORT_JOB_READY_THRESHOLD = 70;

const buildReportPipeline = (matchUsers) => {
  return [
    {
      $match: matchUsers
    },
    {
      $lookup: {
        from: "resumes",
        localField: "_id",
        foreignField: "userId",
        as: "resume"
      }
    },
    {
      $unwind: {
        path: "$resume",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $addFields: {
        resumeCompleted: {
          $gte: ["$resume.resumeCompletion", 100]
        },
        jobReady: {
          $gte: ["$resume.jobMatchScore", REPORT_JOB_READY_THRESHOLD]
        },
        atsScoreValue: {
          $ifNull: ["$resume.atsScore", 0]
        }
      }
    },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              totalStudents: { $sum: 1 },
              resumesCompletedCount: {
                $sum: {
                  $cond: [{ $eq: ["$resumeCompleted", true] }, 1, 0]
                }
              },
              jobReadyCount: {
                $sum: { $cond: [{ $eq: ["$jobReady", true] }, 1, 0] }
              },
              sumAtsScore: { $sum: "$atsScoreValue" }
            }
          }
        ],
        byYear: [
          {
            $group: {
              _id: "$year",
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              year: "$_id",
              count: 1
            }
          },
          {
            $sort: { year: 1 }
          }
        ],
        byDepartment: [
          {
            $group: {
              _id: "$department",
              count: { $sum: 1 },
              placed: {
                $sum: {
                  $cond: [{ $eq: ["$placementStatus", "placed"] }, 1, 0]
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              department: "$_id",
              count: 1,
              placed: 1
            }
          },
          {
            $sort: { department: 1 }
          }
        ]
      }
    }
  ];
};

const formatReportResult = (result) => {
  const overall = (result[0] && result[0].overall && result[0].overall[0]) || {};
  const totalStudents = overall.totalStudents || 0;
  const resumesCompletedCount = overall.resumesCompletedCount || 0;
  const jobReadyCount = overall.jobReadyCount || 0;
  const sumAtsScore = overall.sumAtsScore || 0;

  const averageAtsScore =
    totalStudents > 0 ? sumAtsScore / totalStudents : 0;

  const distributionByYear =
    (result[0] && result[0].byYear) || [];

  const distributionByDepartment =
    (result[0] && result[0].byDepartment) || [];

  return {
    totalStudents,
    resumesCompletedCount,
    averageAtsScore,
    jobReadyCount,
    distributionByYear,
    distributionByDepartment
  };
};

const sendReportResponse = (res, data) => {
  res.status(200).json(data);
};

exports.adminOverviewReport = async (req, res) => {
  try {
    // Strict hierarchy: include only college-managed students
    const matchUsers = { role: ROLES.STUDENT };

    const pipeline = buildReportPipeline(matchUsers);
    const result = await User.aggregate(pipeline);

    const data = formatReportResult(result);

    if (req.user) {
      logAudit(req.user, "REPORT_VIEWED_ADMIN", "report", null, req);
    }

    sendReportResponse(res, data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.hodDepartmentReport = async (req, res) => {
  try {
    const department =
      req.user && typeof req.user.department === "string"
        ? req.user.department
        : null;

    if (!department) {
      return res.status(400).json({
        message: "HOD department not configured"
      });
    }

    const matchUsers = {
      // Strict hierarchy: include only college-managed students
      role: ROLES.STUDENT,
      department,
      ...(req.user?.collegeId ? { collegeId: req.user.collegeId } : {}),
    };

    const pipeline = buildReportPipeline(matchUsers);
    const result = await User.aggregate(pipeline);

    const data = formatReportResult(result);

    if (req.user) {
      logAudit(req.user, "REPORT_VIEWED_HOD", "report", null, req);
    }

    sendReportResponse(res, data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.principalOverviewReport = async (req, res) => {
  try {
    const matchUsers = {
      // Strict hierarchy: include only college-managed students
      role: ROLES.STUDENT,
      ...(req.user?.collegeId ? { collegeId: req.user.collegeId } : {}),
    };

    const pipeline = buildReportPipeline(matchUsers);
    const result = await User.aggregate(pipeline);

    const data = formatReportResult(result);

    if (req.user) {
      logAudit(req.user, "REPORT_VIEWED_PRINCIPAL", "report", null, req);
    }

    sendReportResponse(res, data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.placementOverviewReport = async (req, res) => {
  try {
    const matchUsers = {
      // Strict hierarchy: include only college-managed students
      role: ROLES.STUDENT,
      ...(req.user?.collegeId ? { collegeId: req.user.collegeId } : {}),
    };

    const pipeline = buildReportPipeline(matchUsers);
    const result = await User.aggregate(pipeline);

    const data = formatReportResult(result);

    if (req.user) {
      logAudit(req.user, "REPORT_VIEWED_PLACEMENT", "report", null, req);
    }

    sendReportResponse(res, data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
