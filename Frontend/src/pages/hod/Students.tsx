"use client"

import { useState, useEffect } from "react"
import { Users, Search, X, Upload } from "lucide-react"
import HODSidebar from "@/components/hod-sidebar"
import { hodAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"

interface Student {
  id: string
  name: string
  rollNo: string
  email: string
  phone: string
  department: string
  cgpa: number
  year: string
  resumeStatus: "completed" | "pending" | "not-started"
  placementStatus: "placed" | "applying" | "available"
}

interface BulkImportRowResult {
  rowNumber: number
  status: "success" | "failed" | "skipped"
  reason: string
  name: string
  email: string
  year: number | null
}

interface BulkImportSummary {
  totalRows: number
  successCount: number
  skippedCount: number
  failedCount: number
  importedByYear: {
    secondYear: number
    thirdYear: number
    fourthYear: number
  }
  results: BulkImportRowResult[]
}

interface InviteRecord {
  id: string
  email: string
  status: string
  expiresAt?: string | null
  acceptedAt?: string | null
  revokedAt?: string | null
  createdAt?: string | null
}

export default function HODStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterDept, setFilterDept] = useState<string>("all")
  const [filterPlacement, setFilterPlacement] = useState<string>("all")
  const [filterResume, setFilterResume] = useState<string>("all")
  const [filterYear, setFilterYear] = useState<string>("all")
  const [filterSection, setFilterSection] = useState<string>("all")
  const [attendanceMin, setAttendanceMin] = useState<string>("")
  const [skillsFilter, setSkillsFilter] = useState<string>("")
  const [cgpaSort, setCgpaSort] = useState<string>("")
  const [percentageSort, setPercentageSort] = useState<string>("")
  const [backlogsSort, setBacklogsSort] = useState<string>("")

  useEffect(() => {
    fetchStudents()
  }, [searchTerm, filterDept, filterPlacement, filterResume, filterYear, filterSection, attendanceMin, skillsFilter, cgpaSort, percentageSort, backlogsSort])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await hodAPI.listStudents({
        search: searchTerm,
        department: filterDept,
        resumeStatus: filterResume,
        placementStatus: filterPlacement,
        year: filterYear,
        section: filterSection,
        attendanceMin,
        skills: skillsFilter,
        cgpaSort,
        percentageSort,
        backlogsSort,
      })
      setStudents(res.data)
    } catch (error) {
      console.error("Failed to fetch students", error)
    } finally {
      setLoading(false)
    }
  }

  const departments = Array.from(new Set(students.map((s) => s.department)))
  const sections = Array.from(new Set(students.map((s: any) => s.section).filter(Boolean)))
  const groupedByYear = {
    second: students.filter((s) => String((s as any).year || "").startsWith("2")),
    third: students.filter((s) => String((s as any).year || "").startsWith("3")),
    fourth: students.filter((s) => String((s as any).year || "").startsWith("4")),
    other: students.filter((s) => {
      const y = String((s as any).year || "")
      return !y.startsWith("2") && !y.startsWith("3") && !y.startsWith("4")
    }),
  }

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteDepartment, setInviteDepartment] = useState("")
  const [inviteYear, setInviteYear] = useState("")
  const [inviteBatch, setInviteBatch] = useState("")
  const [inviteRollNo, setInviteRollNo] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [invites, setInvites] = useState<InviteRecord[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState("")
  const [importSummary, setImportSummary] = useState<BulkImportSummary | null>(null)

  const submitInvite = async () => {
    setInviteError("")
    setInviteSuccess("")
    setInviteToken(null)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!inviteEmail || !inviteName || !inviteYear) {
      setInviteError("Please fill Email, Name, and Year at minimum.")
      return
    }
    if (!emailRegex.test(inviteEmail)) {
      setInviteError("Invalid email format")
      return
    }
    setInviteLoading(true)
    try {
      const res = await hodAPI.inviteStudent({
        email: inviteEmail,
        name: inviteName,
        department: inviteDepartment || undefined,
        year: parseInt(inviteYear, 10),
        batch: inviteBatch || undefined,
        rollNo: inviteRollNo || undefined,
      })
      const data: any = res.data || {}
      setInviteSuccess(data.message || "Student invited successfully")
      if (data.token) setInviteToken(data.token)
      setInviteEmail("")
      setInviteName("")
      setInviteDepartment("")
      setInviteYear("")
      setInviteBatch("")
      setInviteRollNo("")
      await loadInvites()
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to send invite"
      setInviteError(msg)
    } finally {
      setInviteLoading(false)
    }
  }

  const loadInvites = async () => {
    try {
      setInvitesLoading(true)
      const res = await hodAPI.listInvites()
      const list = Array.isArray(res.data?.invites) ? res.data.invites : []
      setInvites(list)
    } catch (error) {
      console.error("Failed to load invites", error)
    } finally {
      setInvitesLoading(false)
    }
  }

  const handleRevokeInvite = async (id: string) => {
    try {
      await hodAPI.revokeInvite(id)
      await loadInvites()
    } catch (error: any) {
      setInviteError(error?.response?.data?.message || "Failed to revoke invite")
    }
  }

  const handleResendInvite = async (id: string) => {
    try {
      await hodAPI.resendInvite(id)
      await loadInvites()
    } catch (error: any) {
      setInviteError(error?.response?.data?.message || "Failed to resend invite")
    }
  }

  useEffect(() => {
    if (inviteOpen) {
      loadInvites()
    }
  }, [inviteOpen])

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = String(reader.result || "")
        const base64 = result.includes(",") ? result.split(",")[1] : result
        if (!base64) return reject(new Error("Failed to read file"))
        resolve(base64)
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })
  }

  const submitBulkImport = async () => {
    setImportError("")
    setImportSummary(null)

    if (!importFile) {
      setImportError("Please select a CSV/XLSX file")
      return
    }

    const lowerName = importFile.name.toLowerCase()
    if (!(lowerName.endsWith(".csv") || lowerName.endsWith(".xlsx"))) {
      setImportError("Unsupported file format. Upload CSV or XLSX only.")
      return
    }

    setImportLoading(true)
    try {
      const fileBase64 = await fileToBase64(importFile)
      const res = await hodAPI.bulkImportStudents({
        fileName: importFile.name,
        fileMimeType: importFile.type || (importFile.name.toLowerCase().endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        fileBase64,
      })
      const data: any = res.data || {}
      const summary: BulkImportSummary | null = data.summary || null
      setImportSummary(summary)
      if ((summary?.successCount || 0) > 0) {
        await fetchStudents()
      }
    } catch (error: any) {
      setImportError(
        error?.response?.data?.message ||
        error?.message ||
        "Bulk import failed"
      )
    } finally {
      setImportLoading(false)
    }
  }

  const exportStudentsZip = async () => {
    try {
      const res = await hodAPI.exportStudentsZip()
      const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/zip" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "students-export.zip"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert("Export failed")
      console.error("Export students zip failed", err)
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #1e2a78 0%, #2d3a8c 25%, #1a1d3e 60%, #0f1238 100%)",
      }}
    >
      <div className="flex">
        <HODSidebar />

        <main className="flex-1 ml-64">
          <header className="app-header px-8 py-5 shadow-lg border-b border-white/10">
            <div className="flex items-center gap-3 text-white">
              <Users className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Student Management</h1>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={() => setInviteOpen(true)} className="bg-teal-600 hover:bg-teal-700">
                Invite Student
              </Button>
              <Button onClick={() => setImportOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
              <Button onClick={exportStudentsZip} className="bg-white text-black hover:bg-gray-100">
                Export ZIP
              </Button>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Total Students</h3>
                <div className="text-3xl font-bold text-white">{students.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Placed</h3>
                <div className="text-3xl font-bold text-green-400">
                  {students.filter((s) => s.placementStatus === "placed").length}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Resume Completed</h3>
                <div className="text-3xl font-bold text-teal-400">
                  {students.filter((s) => s.resumeStatus === "completed").length}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Avg CGPA</h3>
                <div className="text-3xl font-bold text-white">
                  {students.length > 0 ? (students.reduce((sum, s) => sum + (s.cgpa || 0), 0) / students.length).toFixed(2) : "0.00"}
                </div>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="relative md:col-span-2">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students, roll no or email..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <select value={filterPlacement} onChange={(e) => setFilterPlacement(e.target.value)} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="all">All Placement Status</option>
                  <option value="placed">Placed</option>
                  <option value="applying">Applying</option>
                  <option value="available">Available</option>
                </select>
              </div>

              <div>
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="all">All Years</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div>
                <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="all">All Sections</option>
                  {sections.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <select value={filterResume} onChange={(e) => setFilterResume(e.target.value)} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="all">All Resume Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="not-started">Not started</option>
                </select>
              </div>
              <div>
                <input
                  type="number"
                  value={attendanceMin}
                  onChange={(e) => setAttendanceMin(e.target.value)}
                  placeholder="Min Attendance %"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                />
              </div>
              <div>
                <input
                  value={skillsFilter}
                  onChange={(e) => setSkillsFilter(e.target.value)}
                  placeholder="Skills (comma)"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                />
              </div>
              <div>
                <select value={cgpaSort} onChange={(e) => setCgpaSort(e.target.value)} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="">CGPA Sort</option>
                  <option value="asc">CGPA ASC</option>
                  <option value="desc">CGPA DESC</option>
                </select>
              </div>
              <div>
                <select value={percentageSort} onChange={(e) => setPercentageSort(e.target.value)} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="">12th % Sort</option>
                  <option value="asc">12th % ASC</option>
                  <option value="desc">12th % DESC</option>
                </select>
              </div>
              <div>
                <select value={backlogsSort} onChange={(e) => setBacklogsSort(e.target.value)} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="">Backlogs Sort</option>
                  <option value="asc">Backlogs ASC</option>
                  <option value="desc">Backlogs DESC</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">2nd Year</h3>
              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-3 text-white/80">Roll No</th><th className="px-4 py-3 text-white/80">Name</th><th className="px-4 py-3 text-white/80">Email</th><th className="px-4 py-3 text-white/80">Phone</th><th className="px-4 py-3 text-white/80">Department</th><th className="px-4 py-3 text-white/80">Year</th><th className="px-4 py-3 text-white/80">CGPA</th><th className="px-4 py-3 text-white/80">Resume</th><th className="px-4 py-3 text-white/80">Placement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {groupedByYear.second.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-white/80">{student.rollNo}</td><td className="px-4 py-3 text-white font-medium">{student.name}</td><td className="px-4 py-3 text-white/70">{student.email}</td><td className="px-4 py-3 text-white/70">{student.phone}</td><td className="px-4 py-3 text-white/70">{student.department}</td><td className="px-4 py-3 text-white/70">{student.year}</td><td className="px-4 py-3 text-white/70">{student.cgpa}</td>
                      <td className="px-4 py-3"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${student.resumeStatus === "completed" ? "bg-green-500/20 text-green-400" : student.resumeStatus === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{student.resumeStatus}</span></td>
                      <td className="px-4 py-3"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${student.placementStatus === "placed" ? "bg-green-500/20 text-green-400" : student.placementStatus === "applying" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>{student.placementStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3 className="text-white font-semibold mb-2">3rd Year</h3>
              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-3 text-white/80">Roll No</th><th className="px-4 py-3 text-white/80">Name</th><th className="px-4 py-3 text-white/80">Email</th><th className="px-4 py-3 text-white/80">Phone</th><th className="px-4 py-3 text-white/80">Department</th><th className="px-4 py-3 text-white/80">Year</th><th className="px-4 py-3 text-white/80">CGPA</th><th className="px-4 py-3 text-white/80">Resume</th><th className="px-4 py-3 text-white/80">Placement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {groupedByYear.third.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-white/80">{student.rollNo}</td><td className="px-4 py-3 text-white font-medium">{student.name}</td><td className="px-4 py-3 text-white/70">{student.email}</td><td className="px-4 py-3 text-white/70">{student.phone}</td><td className="px-4 py-3 text-white/70">{student.department}</td><td className="px-4 py-3 text-white/70">{student.year}</td><td className="px-4 py-3 text-white/70">{student.cgpa}</td>
                      <td className="px-4 py-3"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${student.resumeStatus === "completed" ? "bg-green-500/20 text-green-400" : student.resumeStatus === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{student.resumeStatus}</span></td>
                      <td className="px-4 py-3"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${student.placementStatus === "placed" ? "bg-green-500/20 text-green-400" : student.placementStatus === "applying" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>{student.placementStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3 className="text-white font-semibold mb-2">4th Year</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-3 text-white/80">Roll No</th>
                    <th className="px-4 py-3 text-white/80">Name</th>
                    <th className="px-4 py-3 text-white/80">Email</th>
                    <th className="px-4 py-3 text-white/80">Phone</th>
                    <th className="px-4 py-3 text-white/80">Department</th>
                    <th className="px-4 py-3 text-white/80">Year</th>
                    <th className="px-4 py-3 text-white/80">CGPA</th>
                    <th className="px-4 py-3 text-white/80">Resume</th>
                    <th className="px-4 py-3 text-white/80">Placement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {groupedByYear.fourth.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-white/80">{student.rollNo}</td>
                      <td className="px-4 py-3 text-white font-medium">{student.name}</td>
                      <td className="px-4 py-3 text-white/70">{student.email}</td>
                      <td className="px-4 py-3 text-white/70">{student.phone}</td>
                      <td className="px-4 py-3 text-white/70">{student.department}</td>
                      <td className="px-4 py-3 text-white/70">{student.year}</td>
                      <td className="px-4 py-3 text-white/70">{student.cgpa}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${student.resumeStatus === "completed" ? "bg-green-500/20 text-green-400" : student.resumeStatus === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                          {student.resumeStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${student.placementStatus === "placed" ? "bg-green-500/20 text-green-400" : student.placementStatus === "applying" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
                          {student.placementStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {groupedByYear.other.length > 0 && (
                <>
                  <h3 className="text-white font-semibold mb-2 mt-6">Other / Pending</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="px-4 py-3 text-white/80">Roll No</th>
                        <th className="px-4 py-3 text-white/80">Name</th>
                        <th className="px-4 py-3 text-white/80">Email</th>
                        <th className="px-4 py-3 text-white/80">Phone</th>
                        <th className="px-4 py-3 text-white/80">Department</th>
                        <th className="px-4 py-3 text-white/80">Year</th>
                        <th className="px-4 py-3 text-white/80">CGPA</th>
                        <th className="px-4 py-3 text-white/80">Resume</th>
                        <th className="px-4 py-3 text-white/80">Placement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {groupedByYear.other.map((student) => (
                        <tr key={student.id} className="hover:bg-white/5 transition">
                          <td className="px-4 py-3 text-white/80">{student.rollNo}</td>
                          <td className="px-4 py-3 text-white font-medium">{student.name}</td>
                          <td className="px-4 py-3 text-white/70">{student.email}</td>
                          <td className="px-4 py-3 text-white/70">{student.phone}</td>
                          <td className="px-4 py-3 text-white/70">{student.department}</td>
                          <td className="px-4 py-3 text-white/70">{student.year}</td>
                          <td className="px-4 py-3 text-white/70">{student.cgpa}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${student.resumeStatus === "completed" ? "bg-green-500/20 text-green-400" : student.resumeStatus === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                              {student.resumeStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${student.placementStatus === "placed" ? "bg-green-500/20 text-green-400" : student.placementStatus === "applying" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
                              {student.placementStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <table className="w-full text-sm">
                <tbody className="divide-y divide-white/10">
                  {students.length === 0 && !loading && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-white/50">
                        No students found
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-white/50">
                        Loading...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {inviteOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setInviteOpen(false)} />
              <div className="relative bg-white/5 border border-white/20 rounded-2xl p-6 w-full max-w-lg mx-4 text-white backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Invite Student</h2>
                  <button onClick={() => setInviteOpen(false)} className="p-1 hover:bg-white/10 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {inviteError && (
                  <div className="mb-3 px-3 py-2 rounded bg-red-500/20 border border-red-500/40 text-sm">{inviteError}</div>
                )}
                {inviteSuccess && (
                  <div className="mb-3 px-3 py-2 rounded bg-green-500/20 border border-green-500/40 text-sm">
                    {inviteSuccess}
                    {inviteToken && (
                      <div className="mt-2 break-all">Token: {inviteToken}</div>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Email</label>
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="student@example.com"
                      type="email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Name</label>
                    <input
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="Full name"
                      type="text"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Department (Optional)</label>
                      <input
                        value={inviteDepartment}
                        onChange={(e) => setInviteDepartment(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="e.g., CSE (leave blank to use yours)"
                        type="text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Year</label>
                      <input
                        value={inviteYear}
                        onChange={(e) => setInviteYear(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="e.g., 4"
                        type="number"
                        min="1"
                        max="8"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Batch (Optional)</label>
                      <input
                        value={inviteBatch}
                        onChange={(e) => setInviteBatch(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="e.g., 2022-2026"
                        type="text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">USN / Roll No (Optional)</label>
                      <input
                        value={inviteRollNo}
                        onChange={(e) => setInviteRollNo(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="e.g., 1MS20IS001"
                        type="text"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-5">
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submitInvite} disabled={inviteLoading} className="bg-teal-600 hover:bg-teal-700">
                    {inviteLoading ? "Inviting..." : "Send Invite"}
                  </Button>
                </div>

                <div className="mt-6 pt-4 border-t border-white/15">
                  <h3 className="text-sm font-semibold mb-2">Recent Invites</h3>
                  {invitesLoading ? (
                    <div className="text-xs text-white/60">Loading invites...</div>
                  ) : invites.length === 0 ? (
                    <div className="text-xs text-white/60">No invites yet.</div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto border border-white/10 rounded">
                      <table className="w-full text-xs">
                        <thead className="bg-white/10 sticky top-0">
                          <tr className="text-left">
                            <th className="px-2 py-2">Email</th>
                            <th className="px-2 py-2">Status</th>
                            <th className="px-2 py-2">Expires</th>
                            <th className="px-2 py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {invites.map((inv) => {
                            const active = inv.status === "pending" || inv.status === "invited"
                            return (
                              <tr key={inv.id}>
                                <td className="px-2 py-2">{inv.email}</td>
                                <td className="px-2 py-2">
                                  <span className={`px-2 py-1 rounded-full ${active ? "bg-blue-500/20 text-blue-300" : inv.status === "accepted" ? "bg-green-500/20 text-green-300" : inv.status === "revoked" ? "bg-red-500/20 text-red-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="px-2 py-2">{inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "-"}</td>
                                <td className="px-2 py-2">
                                  <div className="flex gap-2">
                                    {active && (
                                      <button onClick={() => handleRevokeInvite(inv.id)} className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200">
                                        Revoke
                                      </button>
                                    )}
                                    <button onClick={() => handleResendInvite(inv.id)} className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200">
                                      Resend
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {importOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setImportOpen(false)} />
              <div className="relative bg-white/5 border border-white/20 rounded-2xl p-6 w-full max-w-2xl mx-4 text-white backdrop-blur max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Bulk Import Students</h2>
                  <button onClick={() => setImportOpen(false)} className="p-1 hover:bg-white/10 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-sm text-white/70 mb-4">
                  Upload CSV/XLSX with required columns: <span className="font-semibold text-white">name, email, year</span>.
                  <br />
                  Optional columns: <span className="font-semibold text-white">usn, section</span>.
                </div>

                {importError && (
                  <div className="mb-3 px-3 py-2 rounded bg-red-500/20 border border-red-500/40 text-sm">{importError}</div>
                )}

                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-1">Select file</label>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  />
                  {importFile && (
                    <div className="mt-2 text-xs text-white/60">
                      Selected: {importFile.name}
                    </div>
                  )}
                </div>

                {importSummary && (
                  <div className="mb-4 rounded-lg border border-white/20 bg-white/5 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>Total: <span className="font-semibold text-white">{importSummary.totalRows}</span></div>
                      <div>Imported: <span className="font-semibold text-green-400">{importSummary.successCount}</span></div>
                      <div>Skipped: <span className="font-semibold text-yellow-400">{importSummary.skippedCount}</span></div>
                      <div>Failed: <span className="font-semibold text-red-400">{importSummary.failedCount}</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs text-white/70 mb-3">
                      <div>2nd Year: {importSummary.importedByYear.secondYear}</div>
                      <div>3rd Year: {importSummary.importedByYear.thirdYear}</div>
                      <div>4th Year: {importSummary.importedByYear.fourthYear}</div>
                    </div>
                    {importSummary.results.length > 0 && (
                      <div className="max-h-56 overflow-y-auto border border-white/10 rounded">
                        <table className="w-full text-xs">
                          <thead className="bg-white/10 sticky top-0">
                            <tr className="text-left">
                              <th className="px-3 py-2">Row</th>
                              <th className="px-3 py-2">Email</th>
                              <th className="px-3 py-2">Status</th>
                              <th className="px-3 py-2">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {importSummary.results.map((row) => (
                              <tr key={`${row.rowNumber}-${row.email}-${row.status}`}>
                                <td className="px-3 py-2">{row.rowNumber}</td>
                                <td className="px-3 py-2">{row.email || "-"}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-1 rounded-full ${row.status === "success" ? "bg-green-500/20 text-green-400" : row.status === "skipped" ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-400"}`}>
                                    {row.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2">{row.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 mt-5">
                  <Button variant="outline" onClick={() => setImportOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={submitBulkImport} disabled={importLoading} className="bg-blue-600 hover:bg-blue-700">
                    {importLoading ? "Importing..." : "Import Students"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div >
    </div >
  )
}
