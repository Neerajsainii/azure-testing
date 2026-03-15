const ReportApproval = require("../models/ReportApproval")
const { getPrincipalAnalytics, buildReportRows, toCsv, toXlsxBuffer, toPdfBuffer, REPORT_FOOTER } = require("../services/reportService")
const { logger } = require("../utils/logger")

exports.approveReport = async (req, res) => {
  try {
    const { reportId } = req.params
    if (!reportId) return res.status(400).json({ message: "reportId is required" })
    const approval = await ReportApproval.findOneAndUpdate(
      { reportId, collegeId: req.user.collegeId || null },
      {
        $set: {
          reportId,
          approvedBy: req.user._id,
          collegeId: req.user.collegeId || null,
          notes: req.body?.notes || "",
          approvedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    )
    return res.status(201).json({ message: "Report approved", approval })
  } catch (error) {
    logger.error("report_approval_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(500).json({ message: "Failed to approve report" })
  }
}

exports.exportPrincipalReport = async (req, res) => {
  try {
    const format = String(req.query.format || "csv").toLowerCase()
    const analytics = await getPrincipalAnalytics(req.user)
    const rows = buildReportRows(analytics)

    if (format === "xlsx") {
      const buffer = toXlsxBuffer(rows, analytics)
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      res.setHeader("Content-Disposition", `attachment; filename="principal-report.xlsx"`)
      return res.send(buffer)
    }

    if (format === "pdf") {
      const buffer = await toPdfBuffer(rows)
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename="principal-report.pdf"`)
      return res.send(buffer)
    }

    const csv = `${toCsv(rows)}\n# ${REPORT_FOOTER}\n`
    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", `attachment; filename="principal-report.csv"`)
    return res.send(csv)
  } catch (error) {
    logger.error("principal_report_export_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(500).json({ message: "Failed to export report" })
  }
}
