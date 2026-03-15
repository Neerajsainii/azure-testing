"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Search } from "lucide-react"
import HODSidebar from "@/components/hod-sidebar"
import CustomDropdown from "@/components/CustomDropdown"
import { hodAPI } from "@/lib/api"

interface Approval {
  id: string
  studentName: string
  rollNo: string
  requestType: string
  requestDate: string
  description: string
  status: "pending" | "approved" | "rejected"
}

export default function HODApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  // const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApprovals()
  }, [])

  const fetchApprovals = async () => {
    try {
      const res = await hodAPI.getApprovals()
      setApprovals(res.data)
    } catch (error) {
      console.error("Failed to fetch approvals", error)
    }
  }

  const handleApproval = async (id: string, newStatus: "approved" | "rejected") => {
    try {
        await hodAPI.updateApproval(id, newStatus)
        setApprovals(approvals.map(approval =>
            approval.id === id ? { ...approval, status: newStatus } : approval
        ))
    } catch (error) {
        console.error("Failed to update approval", error)
        alert("Failed to update approval status")
    }
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all")

  const filtered = approvals.filter((a) => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false
    if (!searchTerm) return true
    return (
      a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.requestType.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const pendingCount = approvals.filter(a => a.status === "pending").length
  const approvedCount = approvals.filter(a => a.status === "approved").length
  const rejectedCount = approvals.filter(a => a.status === "rejected").length

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
              <CheckCircle className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Approvals</h1>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Pending</h3>
                <div className="text-3xl font-bold text-yellow-400">{pendingCount}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Approved</h3>
                <div className="text-3xl font-bold text-green-400">{approvedCount}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Rejected</h3>
                <div className="text-3xl font-bold text-red-400">{rejectedCount}</div>
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
                  placeholder="Search name, roll, or type..."
                  className="w-full md:w-96 pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <CustomDropdown
                  items={["all", "pending", "approved", "rejected"]}
                  value={filterStatus}
                  onChange={(v) => setFilterStatus(v as any)}
                  placeholder="Status"
                />
              </div>
            </div>

            {/* Approvals Table */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="px-4 py-3 text-white/80">Student</th>
                      <th className="px-4 py-3 text-white/80">Roll No</th>
                      <th className="px-4 py-3 text-white/80">Request</th>
                      <th className="px-4 py-3 text-white/80">Requested On</th>
                      <th className="px-4 py-3 text-white/80">Description</th>
                      <th className="px-4 py-3 text-white/80">Status</th>
                      <th className="px-4 py-3 text-white/80">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filtered.map((approval) => (
                      <tr key={approval.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 text-white">{approval.studentName}</td>
                        <td className="px-4 py-3 text-white/70">{approval.rollNo}</td>
                        <td className="px-4 py-3 text-white/70">{approval.requestType}</td>
                        <td className="px-4 py-3 text-white/70">{approval.requestDate}</td>
                        <td className="px-4 py-3 text-white/70">{approval.description}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              approval.status === "approved"
                                ? "bg-green-500/20 text-green-400"
                                : approval.status === "rejected"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {approval.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {approval.status === "pending" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproval(approval.id, "approved")}
                                className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/40 rounded-lg transition text-sm font-semibold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproval(approval.id, "rejected")}
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-lg transition text-sm font-semibold"
                              >
                                Reject
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
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
