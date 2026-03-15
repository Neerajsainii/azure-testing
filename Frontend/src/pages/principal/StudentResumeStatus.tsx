"use client"

import { useState, useEffect } from "react"
import { FileText, Search, Users, CheckCircle, Clock, XCircle } from "lucide-react"
import PrincipalSidebar from "@/components/principal-sidebar"
import { principalAPI } from "@/lib/api"

interface ResumeStatus {
  id: string
  studentName: string
  rollNo: string
  department: string
  status: "completed" | "in-progress" | "not-started"
  lastUpdated: string
  completionPercentage: number
}

export default function PrincipalStudentResumeStatusPage() {
  const [resumeStatuses, setResumeStatuses] = useState<ResumeStatus[]>([])
  // const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
        try {
            const res = await principalAPI.getStudentResumeStatus()
            const mapped = Array.isArray(res.data) ? res.data.map((s: any) => ({
                id: s.id || s._id,
                studentName: s.name,
                rollNo: s.rollNo || "N/A",
                department: s.department || "N/A",
                status: s.resumeStatus || "not-started",
                lastUpdated: s.lastUpdated || "N/A",
                completionPercentage: s.resumeCompletion || 0
            })) : []
            setResumeStatuses(mapped)
        } catch (err) {
            console.error("Failed to fetch resume statuses", err)
        } finally {
            // setLoading(false)
        }
    }
    load()
  }, [])

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredStatuses = resumeStatuses.filter((status) => {
    const matchesSearch =
      status.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || status.status === filterStatus
    return matchesSearch && matchesStatus
  })

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
        <PrincipalSidebar />

        <main className="flex-1 ml-64">
          <header className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-8 py-5 shadow-lg">
            <div className="flex items-center gap-3 text-white">
              <FileText className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Student Resume Status</h1>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Total</h3>
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

            {/* Filters */}
            <div className="mb-6 flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all" className="bg-[#1a1d3e]">All Status</option>
                <option value="completed" className="bg-[#1a1d3e]">Completed</option>
                <option value="in-progress" className="bg-[#1a1d3e]">In Progress</option>
                <option value="not-started" className="bg-[#1a1d3e]">Not Started</option>
              </select>
            </div>

            {/* Resume Status Table */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-xl border border-white/10">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Student</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Roll No</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Department</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Completion</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredStatuses.map((status) => (
                    <tr key={status.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-white">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-indigo-400" />
                          {status.studentName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/70">{status.rollNo}</td>
                      <td className="px-6 py-4 text-white/70 text-sm">{status.department}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-white/10 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                status.completionPercentage === 100
                                  ? "bg-green-500"
                                  : status.completionPercentage > 0
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${status.completionPercentage}%` }}
                            />
                          </div>
                          <span className="text-white/70 text-sm">{status.completionPercentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                            status.status === "completed"
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
                      <td className="px-6 py-4 text-white/70 text-sm">{status.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
