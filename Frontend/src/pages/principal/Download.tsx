"use client"

import { Download, FileText, Calendar, Building2 } from "lucide-react"
import PrincipalSidebar from "@/components/principal-sidebar"
import { useState } from "react"
import { principalAPI } from "@/lib/api"

interface Report {
  id: number
  title: string
  description: string
  type: string
  date: string
  size: string
  category: string
}

export default function PrincipalDownloadPage() {
  const reports: Report[] = [
    {
      id: 1,
      title: "Complete Student Database",
      description: "All student records with complete details",
      type: "Excel",
      date: new Date().toISOString().split("T")[0],
      size: "Dynamic",
      category: "students",
    },
    {
      id: 2,
      title: "Department-wise Performance Report",
      description: "Academic and placement performance by department",
      type: "PDF / Excel",
      date: new Date().toISOString().split("T")[0],
      size: "Dynamic",
      category: "departments",
    },
    {
      id: 3,
      title: "Granted Access Report",
      description: "All access grants and permissions",
      type: "Excel",
      date: new Date().toISOString().split("T")[0],
      size: "Dynamic",
      category: "access",
    },
  ]

  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)

  const handleDownload = (report: Report) => {
    setSelectedReport(report)
    setDownloadModalOpen(true)
  }

  // dynamic script loader
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

  function rowsToCsv(rows: string[][]) {
    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  }

  async function downloadBlob(blob: Blob, filename: string) {
    const a = document.createElement("a")
    const url = URL.createObjectURL(blob)
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function createPdfFromText(text: string, filename: string) {
    try {
      if (!(window as any).jspdf) {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
      }
      const jspdf = (window as any).jspdf
      if (!jspdf) throw new Error("jsPDF failed to load")
      const { jsPDF } = jspdf
      const doc = new jsPDF()
      const lines = String(text).split("\n")
      let y = 10
      for (const line of lines) {
        doc.text(String(line), 10, y)
        y += 8
      }
      const blob = doc.output("blob")
      await downloadBlob(blob, filename)
    } catch (err) {
      console.error(err)
      // fallback: download plain text with .pdf extension
      const blob = new Blob([text], { type: "application/pdf" })
      await downloadBlob(blob, filename)
    }
  }

  async function createCsvAndDownload(contentRows: string[][], filename: string) {
    const csv = rowsToCsv(contentRows)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    await downloadBlob(blob, filename)
  }

  // Handlers for quick action buttons
  const handleGenerateOverall = async () => {
    try {
      setLoading(true)
      const res = await principalAPI.getStudentRecords()
      const list = res.data || []
      const rows = [["Name", "Roll No", "Email", "Department", "Year", "CGPA", "Status", "Resume"]]
      list.forEach((s: any) => {
        rows.push([s.name, s.rollNo, s.email, s.department, s.year, s.cgpa, s.placementStatus, s.resumeStatus])
      })
      await createCsvAndDownload(rows, `overall-students-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (err) {
      console.error(err)
      alert("Failed to generate overall report: " + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDepartment = async () => {
    try {
      setLoading(true)
      if (!(window as any).JSZip) {
        await loadScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")
      }
      const JSZip = (window as any).JSZip
      const zip = new JSZip()
      const res = await principalAPI.getStudentRecords()
      const list = res.data || []

      const depts = Array.from(new Set(list.map((s: any) => s.department)))
      const folder = zip.folder("departments")
      depts.forEach((d) => {
        const rows = [["Name", "Roll No", "Email", "Year", "CGPA", "Status"]]
        list.filter((s: any) => s.department === d).forEach((s: any) => {
          rows.push([s.name, s.rollNo, s.email, s.year, s.cgpa, s.placementStatus])
        })
        folder?.file(`${d}-students.csv`, rowsToCsv(rows))
      })
      const blob: Blob = await zip.generateAsync({ type: "blob" })
      await downloadBlob(blob, `department-reports-${new Date().toISOString().slice(0, 10)}.zip`)
    } catch (err) {
      console.error(err)
      alert("Failed to generate department reports: " + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMonthly = async () => {
    // For this mockup, download overview report since we don't have months specifically tracked per student readily available
    try {
      setLoading(true)
      const res = await principalAPI.exportReport("csv")
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" })
      await downloadBlob(blob, `monthly-overview-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (err) {
      console.error(err)
      alert("Failed to generate reports: " + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDownload = async () => {
    try {
      setLoading(true)
      if (!(window as any).JSZip) {
        await loadScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")
      }
      const JSZip = (window as any).JSZip
      const zip = new JSZip()

      const stRes = await principalAPI.getStudentRecords()
      const list = stRes.data || []

      const overallRows = [["Name", "Roll No", "Email", "Department", "Year", "CGPA", "Status"]]
      list.forEach((s: any) => overallRows.push([s.name, s.rollNo, s.email, s.department, s.year, s.cgpa, s.placementStatus]))
      zip.file("all_students.csv", rowsToCsv(overallRows))

      const acRes = await principalAPI.getGrantedAccess()
      const acList = acRes.data || []
      const acRows = [["Email", "Role", "Department", "Status"]]
      acList.forEach((a: any) => acRows.push([a.email, a.role, a.department, a.status]))
      zip.file("granted_access.csv", rowsToCsv(acRows))

      const blob: Blob = await zip.generateAsync({ type: "blob" })
      await downloadBlob(blob, `principal-bulk-export-${new Date().toISOString().slice(0, 10)}.zip`)
    } catch (err) {
      console.error(err)
      alert("Failed to generate bulk ZIP: " + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const confirmDownloadFormat = async (format: "excel" | "pdf") => {
    if (!selectedReport) return
    setDownloadModalOpen(false)
    const r = selectedReport
    const filenameBase = r.title.replace(/\s+/g, "-").toLowerCase()

    try {
      setLoading(true)
      if (r.category === "students") {
        const res = await principalAPI.getStudentRecords()
        const rows = [["Name", "Roll No", "Email", "Department", "Year", "CGPA"]]
        res.data.forEach((s: any) => rows.push([s.name, s.rollNo, s.email, s.department, s.year, s.cgpa]))

        if (format === "excel") await createCsvAndDownload(rows, `${filenameBase}.csv`)
        else await createPdfFromText(rowsToCsv(rows), `${filenameBase}.pdf`)
      } else if (r.category === "access") {
        const res = await principalAPI.getGrantedAccess()
        const rows = [["Email", "Role", "Department", "Status"]]
        res.data.forEach((a: any) => rows.push([a.email, a.role, a.department, a.status]))

        if (format === "excel") await createCsvAndDownload(rows, `${filenameBase}.csv`)
        else await createPdfFromText(rowsToCsv(rows), `${filenameBase}.pdf`)
      } else {
        // use backend export directly for others
        const res = await principalAPI.exportReport(format === "excel" ? "xlsx" : "pdf")
        const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" })
        await downloadBlob(blob, `${filenameBase}.${format === "excel" ? "xlsx" : "pdf"}`)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to download report")
    } finally {
      setSelectedReport(null)
      setLoading(false)
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
        <PrincipalSidebar />

        <main className="flex-1 ml-64">
          <header className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-8 py-5 shadow-lg">
            <div className="flex items-center gap-3 text-white">
              <Download className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Download Reports</h1>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <button disabled={loading} onClick={handleGenerateOverall} className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 hover:border-indigo-500/30 transition text-left lift-on-hover fade-in disabled:opacity-50">
                <FileText className="w-8 h-8 text-indigo-400 mb-3" />
                <h3 className="text-white font-bold mb-1">Generate Report</h3>
                <p className="text-white/60 text-sm">Create overall report</p>
              </button>
              <button disabled={loading} onClick={handleGenerateDepartment} className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 hover:border-indigo-500/30 transition text-left lift-on-hover fade-in disabled:opacity-50">
                <Building2 className="w-8 h-8 text-indigo-400 mb-3" />
                <h3 className="text-white font-bold mb-1">Department Report</h3>
                <p className="text-white/60 text-sm">Generate per-department ZIP</p>
              </button>
              <button disabled={loading} onClick={handleGenerateMonthly} className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 hover:border-indigo-500/30 transition text-left lift-on-hover fade-in disabled:opacity-50">
                <Calendar className="w-8 h-8 text-indigo-400 mb-3" />
                <h3 className="text-white font-bold mb-1">Monthly Reports</h3>
                <p className="text-white/60 text-sm">Download monthly overview</p>
              </button>
              <button disabled={loading} onClick={handleBulkDownload} className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 hover:border-indigo-500/30 transition text-left lift-on-hover fade-in disabled:opacity-50">
                <Download className="w-8 h-8 text-indigo-400 mb-3" />
                <h3 className="text-white font-bold mb-1">Bulk Download</h3>
                <p className="text-white/60 text-sm">Generate all reports ZIP</p>
              </button>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 hover:border-indigo-500/30 transition lift-on-hover fade-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 bg-indigo-600/30 rounded-lg flex items-center justify-center">
                        <FileText className="w-7 h-7 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{report.title}</h3>
                        <p className="text-white/70 text-sm mb-2">{report.description}</p>
                        <div className="flex items-center gap-4 text-white/60 text-xs">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {report.date}
                          </span>
                          <span>•</span>
                          <span className="px-2 py-1 bg-indigo-500/20 rounded text-indigo-400">
                            {report.type}
                          </span>
                          <span>•</span>
                          <span>{report.size}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(report)}
                      className="px-6 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 rounded-lg transition flex items-center gap-2 font-semibold soft-transition"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Download format modal */}
            {downloadModalOpen && selectedReport && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-md bg-[#0b1220] border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Download format</h3>
                  <p className="text-sm text-white/70 mb-4">Choose format for <strong className="text-white">{selectedReport.title}</strong></p>
                  <div className="flex gap-3">
                    <button onClick={() => confirmDownloadFormat("excel")} className="flex-1 bg-blue-600 px-4 py-2 rounded text-white">Excel (CSV)</button>
                    <button onClick={() => confirmDownloadFormat("pdf")} className="flex-1 bg-white/10 px-4 py-2 rounded text-white">PDF</button>
                  </div>
                  <div className="mt-4 text-right">
                    <button onClick={() => { setDownloadModalOpen(false); setSelectedReport(null) }} className="text-white/60">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
