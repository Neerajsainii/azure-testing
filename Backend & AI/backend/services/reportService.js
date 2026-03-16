const XLSX = require("xlsx")
const puppeteer = require("puppeteer")
const DriveCandidate = require("../models/DriveCandidate")
const PlacementDrive = require("../models/PlacementDrive")
const User = require("../models/User")
const StudentAcademicProfile = require("../models/StudentAcademicProfile")
const { buildCollegeScope } = require("../utils/accessScope")
const { getCurrentBatches } = require("../utils/academicYearUtil")

const REPORT_FOOTER = "Verified STON TECHNOLOGY"

async function getPrincipalAnalytics(user) {
  const collegeScope = buildCollegeScope(user)
  const studentsMatch = { role: "student", ...collegeScope }

  const [dept, placement, drives, candidates] = await Promise.all([
    User.aggregate([
      { $match: studentsMatch },
      { $group: { _id: "$department", totalStudents: { $sum: 1 }, avgCgpa: { $avg: "$cgpa" }, placed: { $sum: { $cond: [{ $eq: ["$placementStatus", "placed"] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: studentsMatch },
      { $group: { _id: null, total: { $sum: 1 }, placed: { $sum: { $cond: [{ $eq: ["$placementStatus", "placed"] }, 1, 0] } } } },
    ]),
    PlacementDrive.find({ ...collegeScope, deletedAt: null }).select("_id title companyId academicYearLabel").lean(),
    DriveCandidate.find({ ...collegeScope, finalStatus: { $in: ["offered", "joined"] } })
      .select("driveId packageOffered finalStatus createdAt")
      .lean(),
  ])

  const total = placement[0]?.total || 0
  const placed = placement[0]?.placed || 0
  const placementPercentage = total > 0 ? Number(((placed / total) * 100).toFixed(2)) : 0

  const packages = candidates.map((c) => Number(c.packageOffered || 0)).filter((v) => v > 0)
  const highestPackage = packages.length ? Math.max(...packages) : 0
  const averagePackage = packages.length ? Number((packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(2)) : 0

  const batches = getCurrentBatches()
  const batchWise = await StudentAcademicProfile.aggregate([
    { $match: { ...collegeScope, year: { $in: [2, 3, 4] } } },
    { $group: { _id: "$batch", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])

  const driveMap = new Map(drives.map((d) => [String(d._id), d]))
  const companyWiseMap = new Map()
  for (const row of candidates) {
    const drive = driveMap.get(String(row.driveId))
    if (!drive) continue
    const key = String(drive.companyId)
    const cur = companyWiseMap.get(key) || { companyId: key, selections: 0, offers: 0 }
    cur.selections += 1
    if (row.finalStatus === "offered" || row.finalStatus === "joined") cur.offers += 1
    companyWiseMap.set(key, cur)
  }

  return {
    departmentPerformance: dept.map((d) => ({
      department: d._id || "Unknown",
      totalStudents: d.totalStudents || 0,
      placedStudents: d.placed || 0,
      placementPercentage: d.totalStudents ? Number(((d.placed / d.totalStudents) * 100).toFixed(2)) : 0,
      avgCgpa: Number((d.avgCgpa || 0).toFixed(2)),
    })),
    placementOverview: {
      totalStudents: total,
      placedStudents: placed,
      placementPercentage,
      highestPackage,
      averagePackage,
    },
    batchWise: {
      activeBatches: batches,
      rows: batchWise.map((b) => ({ batch: b._id || "Unknown", count: b.count || 0 })),
    },
    companyWise: Array.from(companyWiseMap.values()),
    comparison: dept.map((d) => ({
      department: d._id || "Unknown",
      placementPercentage: d.totalStudents ? Number(((d.placed / d.totalStudents) * 100).toFixed(2)) : 0,
      avgCgpa: Number((d.avgCgpa || 0).toFixed(2)),
    })),
  }
}

function buildReportRows(analytics) {
  const rows = [["Metric", "Value"]]
  rows.push(["Total Students", analytics.placementOverview.totalStudents])
  rows.push(["Placed Students", analytics.placementOverview.placedStudents])
  rows.push(["Placement %", analytics.placementOverview.placementPercentage])
  rows.push(["Highest Package", analytics.placementOverview.highestPackage])
  rows.push(["Average Package", analytics.placementOverview.averagePackage])
  rows.push(["Footer", REPORT_FOOTER])
  return rows
}

function toCsv(rows) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          const s = String(v ?? "")
          if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
          return s
        })
        .join(",")
    )
    .join("\n")
}

function toXlsxBuffer(rows, analytics) {
  const wb = XLSX.utils.book_new()
  const wsMain = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, wsMain, "Overview")
  const wsDept = XLSX.utils.json_to_sheet(analytics.departmentPerformance || [])
  XLSX.utils.book_append_sheet(wb, wsDept, "DepartmentPerformance")
  const wsMeta = XLSX.utils.aoa_to_sheet([["Footer"], [REPORT_FOOTER]])
  XLSX.utils.book_append_sheet(wb, wsMeta, "Meta")
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
}

async function toPdfBuffer(rows) {
  const htmlRows = rows
    .map((r) => `<tr><td style="padding:6px;border:1px solid #ddd;">${r[0]}</td><td style="padding:6px;border:1px solid #ddd;">${r[1]}</td></tr>`)
    .join("")
  const html = `<html><body style="font-family:Arial;padding:24px"><h2>Placement Report</h2><table style="border-collapse:collapse;width:100%">${htmlRows}</table><p style="margin-top:30px;font-weight:bold;">${REPORT_FOOTER}</p></body></html>`
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle0" })
  const buffer = await page.pdf({ format: "A4", printBackground: true })
  await browser.close()
  return buffer
}

module.exports = {
  REPORT_FOOTER,
  getPrincipalAnalytics,
  buildReportRows,
  toCsv,
  toXlsxBuffer,
  toPdfBuffer,
}
