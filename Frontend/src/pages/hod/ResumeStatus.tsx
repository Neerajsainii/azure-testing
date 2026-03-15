"use client"

import { useState, useEffect } from "react"
import { FileText, Search, CheckCircle, Clock, XCircle } from "lucide-react"
import HODSidebar from "@/components/hod-sidebar"
import CustomDropdown from "@/components/CustomDropdown"
import { hodAPI } from "@/lib/api"

interface ResumeStatus {
  id: string
  studentName: string
  rollNo: string
  status: "completed" | "in-progress" | "not-started"
  completionPercentage: number
  lastUpdated: string
}

export default function HODResumeStatusPage() {
  const [resumeStatuses, setResumeStatuses] = useState<ResumeStatus[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "in-progress" | "not-started">("all")

  useEffect(() => {
    fetchData()
  }, [searchTerm, filterStatus])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params: Record<string, any> = {
        search: searchTerm,
      }
      // Only send resumeStatus filter when it's not "all" — sending "all" causes backend $match to find zero results
      if (filterStatus !== "all") {
        params.resumeStatus = filterStatus
      }
      const res = await hodAPI.listStudents(params)

      // Map student list to ResumeStatus format
      const mapped: ResumeStatus[] = res.data.map((s: any) => ({
        id: s.id,
        studentName: s.name,
        rollNo: s.rollNo,
        status: s.resumeStatus === "pending" ? "in-progress" : s.resumeStatus,
        completionPercentage: s.resumeCompletion || 0,
        lastUpdated: s.lastUpdated
      }))
      setResumeStatuses(mapped)
    } catch (error) {
      console.error("Failed to fetch resume statuses", error)
    } finally {
      setLoading(false)
    }
  }

  const completedCount = resumeStatuses.filter((s) => s.status === "completed").length
  const inProgressCount = resumeStatuses.filter((s) => s.status === "in-progress").length
  const notStartedCount = resumeStatuses.filter((s) => s.status === "not-started").length

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
              <FileText className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Resume Status</h1>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Total Students</h3>
                <div className="text-3xl font-bold text-white">{resumeStatuses.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Completed</h3>
                <div className="text-3xl font-bold text-green-400">{completedCount}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">In Progress</h3>
                <div className="text-3xl font-bold text-yellow-400">{inProgressCount}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Not Started</h3>
                <div className="text-3xl font-bold text-red-400">{notStartedCount}</div>
              </div>
            </div>

            {/* Filters + Search */}
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="relative flex-1 w-full md:w-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students or roll no..."
                  className="w-full md:w-96 pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <CustomDropdown
                  items={["all", "completed", "in-progress", "not-started"]}
                  value={filterStatus}
                  onChange={(v) => setFilterStatus(v as any)}
                  placeholder="Status"
                />
              </div>
            </div>

            {/* Resume Status Table */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="px-4 py-3 text-white/80">Student</th>
                      <th className="px-4 py-3 text-white/80">Roll No</th>
                      <th className="px-4 py-3 text-white/80">Completion</th>
                      <th className="px-4 py-3 text-white/80">Status</th>
                      <th className="px-4 py-3 text-white/80">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {resumeStatuses.map((status) => (
                      <tr key={status.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 text-white">{status.studentName}</td>
                        <td className="px-4 py-3 text-white/70">{status.rollNo}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="w-full bg-white/10 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${status.completionPercentage === 100
                                      ? "bg-green-500"
                                      : status.completionPercentage > 0
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                  style={{ width: `${status.completionPercentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-white/70 text-xs w-14 text-right">{status.completionPercentage}%</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${status.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : status.status === "in-progress"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                          >
                            {status.status === "completed" && <CheckCircle className="w-3 h-3" />}
                            {status.status === "in-progress" && <Clock className="w-3 h-3" />}
                            {status.status === "not-started" && <XCircle className="w-3 h-3" />}
                            {status.status.replace("-", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/70">{status.lastUpdated}</td>
                      </tr>
                    ))}
                    {resumeStatuses.length === 0 && !loading && (
                      <tr><td colSpan={5} className="text-center py-4 text-white/50">No students found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

