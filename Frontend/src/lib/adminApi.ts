/* Mock Admin & Reporting API
 * Provides functions to list students with filters, export CSV/ZIP/XLSX, and compute reports.
 * This is a client-side module that now adapts backend report responses to existing UI shapes.
 */
import type { Session } from "@/types/auth"
import { adminAPI, hodAPI, principalAPI, placementAPI } from "./api"
import type { ReportOverview } from "@/types/backend"

// Helper to load script dynamically
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement("script")
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Failed to load script: " + src))
    document.head.appendChild(s)
  })
}

// Mock dataset
export type Student = {
  id: string
  name: string
  email: string
  role: string
  department: string
  batch: string
  year: number
  status: "active" | "inactive" | "placed" | "applying" | "available"
  matchScore: number // 0-100
  atsScore: number // numeric
  rollNo?: string
  phone?: string
  skills?: string[]
  cgpa?: number
}

const SAMPLE_STUDENTS: Student[] = []
// generate sample students
const depts = ["CSE", "ECE", "MECH", "EEE", "IT"]
const roles = ["STUDENT"]
for (let i = 1; i <= 120; i++) {
  const dept = depts[i % depts.length]
  const year = 2018 + (i % 5)
  SAMPLE_STUDENTS.push({
    id: String(i),
    name: `Student ${i}`,
    email: `student${i}@example.com`,
    role: roles[0],
    department: dept,
    batch: `BATCH-${2018 + (i % 5)}`,
    year,
    status: i % 10 === 0 ? "placed" : i % 7 === 0 ? "inactive" : "active",
    matchScore: Math.floor(Math.random() * 101),
    atsScore: Math.floor(Math.random() * 101),
  })
}

// Simple download limits by userId: allow 3 downloads per day by default
const DOWNLOAD_LIMIT_PER_DAY = 3

function getDownloadStateKey(userId: string) {
  return `download_state_${userId}`
}

export function checkDownloadLimit(session: Session | null): { allowed: boolean; remaining: number } {
  if (!session) return { allowed: false, remaining: 0 }
  const key = getDownloadStateKey(session.user.id)
  try {
    const raw = localStorage.getItem(key)
    const today = new Date().toISOString().slice(0, 10)
    let state = raw ? JSON.parse(raw) : { date: today, count: 0 }
    if (state.date !== today) state = { date: today, count: 0 }
    const remaining = Math.max(0, DOWNLOAD_LIMIT_PER_DAY - state.count)
    return { allowed: remaining > 0, remaining }
  } catch {
    return { allowed: true, remaining: DOWNLOAD_LIMIT_PER_DAY }
  }
}

export function recordDownload(session: Session | null): void {
  if (!session) return
  const key = getDownloadStateKey(session.user.id)
  const today = new Date().toISOString().slice(0, 10)
  try {
    const raw = localStorage.getItem(key)
    let state = raw ? JSON.parse(raw) : { date: today, count: 0 }
    if (state.date !== today) state = { date: today, count: 0 }
    state.count = (state.count || 0) + 1
    localStorage.setItem(key, JSON.stringify(state))
  } catch {}
}

// Filter and paging interface
export type StudentFilters = {
  role?: string
  department?: string
  batch?: string
  year?: number
  status?: string
  q?: string
}

export async function getStudents(filters: StudentFilters = {}): Promise<Student[]> {
  // In a real app this would call /api/admin/students
  // Here we filter the SAMPLE_STUDENTS array synchronously
  let result = SAMPLE_STUDENTS.slice()
  if (filters.role) result = result.filter((s) => s.role === filters.role)
  if (filters.department) result = result.filter((s) => s.department === filters.department)
  if (filters.batch) result = result.filter((s) => s.batch === filters.batch)
  if (filters.year) result = result.filter((s) => s.year === filters.year)
  if (filters.status) result = result.filter((s) => s.status === filters.status)
  if (filters.q) {
    const q = filters.q.toLowerCase()
    result = result.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
  }
  // simulate network latency
  await new Promise((r) => setTimeout(r, 200))
  return result
}

// Export ZIP of CSV (observes download limit)
export async function exportStudentsZip(filters: StudentFilters = {}, session: Session | null = null) {
  const { allowed } = checkDownloadLimit(session)
  if (!allowed) throw new Error("Download limit reached")

  const students = await getStudents(filters)
  // build CSV
  const headers = ["ID", "Name", "Email", "Role", "Department", "Batch", "Year", "Status", "MatchScore", "ATSScore"]
  const rows = [headers.join(",")]
  for (const s of students) {
    const r = [s.id, s.name, s.email, s.role, s.department, s.batch, String(s.year), s.status, String(s.matchScore), String(s.atsScore)]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
    rows.push(r)
  }
  const csv = rows.join("\n")

  // ensure JSZip loaded
  if (!(window as any).JSZip) {
    await loadScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")
  }
  const JSZip = (window as any).JSZip
  const zip = new JSZip()
  zip.file("students.csv", csv)
  zip.file("readme.txt", `Exported ${students.length} students\nGenerated: ${new Date().toISOString()}`)
  const blob: Blob = await zip.generateAsync({ type: "blob" })

  // trigger download
  const a = document.createElement("a")
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = `students-${new Date().toISOString().slice(0,19).replace(/[:T]/g, "-")}.zip`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  // record
  recordDownload(session)
}

// Export Excel (XLSX) using SheetJS loaded from CDN
export async function exportStudentsExcel(filters: StudentFilters = {}, session: Session | null = null) {
  const { allowed } = checkDownloadLimit(session)
  if (!allowed) throw new Error("Download limit reached")

  const students = await getStudents(filters)

  // load SheetJS (xlsx) from CDN
  if (!(window as any).XLSX) {
    // official CDN bundle
    await loadScript("https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js")
  }
  const XLSX = (window as any).XLSX
  if (!XLSX) throw new Error("XLSX failed to load")

  const aoa = [["ID", "Name", "Email", "Role", "Department", "Batch", "Year", "Status", "MatchScore", "ATSScore"]]
  for (const s of students) {
    aoa.push([
      s.id,
      s.name,
      s.email,
      s.role,
      s.department,
      s.batch,
      String(s.year),
      s.status,
      String(s.matchScore),
      String(s.atsScore)
    ])
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Students")
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  const blob = new Blob([wbout], { type: "application/octet-stream" })

  const a = document.createElement("a")
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = `students-${new Date().toISOString().slice(0,19).replace(/[:T]/g, "-")}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  recordDownload(session)
}

// Reporting functions
export type ReportSummary = {
  totalStudents: number
  jobReadyCount: number
  avgAtsScore: number
  departmentBreakdown: Record<string, number>
  yearBreakdown: Record<number, number>
}

function adaptReport(overview: ReportOverview): ReportSummary {
  const departmentBreakdown: Record<string, number> = {}
  for (const item of overview.distributionByDepartment) {
    departmentBreakdown[item.department] = (departmentBreakdown[item.department] || 0) + item.count
  }
  const yearBreakdown: Record<number, number> = {}
  for (const item of overview.distributionByYear) {
    const yr = typeof item.year === "string" ? Number(item.year) : item.year
    if (!Number.isNaN(yr)) yearBreakdown[yr] = (yearBreakdown[yr] || 0) + item.count
  }
  return {
    totalStudents: overview.totalStudents,
    jobReadyCount: overview.jobReadyCount,
    avgAtsScore: overview.averageAtsScore,
    departmentBreakdown,
    yearBreakdown,
  }
}

export async function getReportSummary(_filters: StudentFilters = {}): Promise<ReportSummary> {
  const { data } = await adminAPI.getReportOverview()
  return adaptReport(data as ReportOverview)
}

// Role-specific mock endpoints
export async function getRoleReport(role: string, filters: StudentFilters = {}) {
  // role could be ADMIN, HOD, PLACEMENT, PRINCIPAL
  const r = role.toUpperCase()
  if (r === "HOD") {
    const { data } = await hodAPI.getReportOverview()
    const base = adaptReport(data as ReportOverview)
    // HOD gets department-specific detail
    return { ...base, focus: base.departmentBreakdown }
  }
  if (r === "PLACEMENT") {
    const { data } = await placementAPI.getReportOverview()
    const base = adaptReport(data as ReportOverview)
    // Placement officer gets job-ready and placement stats
    return {
      ...base,
      placed: (await getStudents({ ...filters })).filter((s) => s.status === "placed").length,
    }
  }
  if (r === "PRINCIPAL") {
    const { data } = await principalAPI.getReportOverview()
    const base = adaptReport(data as ReportOverview)
    // Principal gets high-level overview
    return { total: base.totalStudents, departments: base.departmentBreakdown }
  }
  // default admin
  return getReportSummary(filters)
}
