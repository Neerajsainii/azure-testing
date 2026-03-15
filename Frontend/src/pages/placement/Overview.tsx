"use client"

import { TrendingUp, Users, Building2, Award, Target } from "lucide-react"
import { useState, useEffect } from "react"
import PlacementSidebar from "@/components/placement-sidebar"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { placementAPI, companiesAPI } from "@/lib/api"
import type { ReportOverviewResponse } from "@/types/dashboard"
import type { Company } from "@/types/company"

const COLORS = ["#8b5cf6", "#a855f7", "#c084fc", "#d8b4fe", "#e9d5ff"]

export default function PlacementOverviewPage() {
  const [reportData, setReportData] = useState<ReportOverviewResponse | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportRes, companiesRes] = await Promise.all([
          placementAPI.getReportOverview(),
          companiesAPI.list()
        ])
        setReportData(reportRes.data)
        setCompanies(companiesRes.data || [])
      } catch (error) {
        console.error("Failed to fetch overview data", error)
      }
    }
    fetchData()
  }, [])

  // Transform data for charts
  const deptData = reportData?.distributionByDepartment || []
  const yearData = reportData?.distributionByYear || []

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #1e2a78 0%, #2d3a8c 25%, #1a1d3e 60%, #0f1238 100%)",
      }}
    >
      <div className="flex">
        <PlacementSidebar />

        <main className="flex-1 ml-64">
          <header className="bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-8 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <TrendingUp className="w-7 h-7" />
                <h1 className="text-2xl font-bold">Placement Overview</h1>
              </div>
              <div>
                <button
                  onClick={async () => {
                    try {
                      const response = await placementAPI.exportReport("xlsx")
                      const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = "placement-overview.xlsx"
                      document.body.appendChild(a)
                      a.click()
                      a.remove()
                      URL.revokeObjectURL(url)
                    } catch (err) {
                       console.error(err)
                       alert("Download failed")
                    }
                  }}
                  className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-white/90 transition font-semibold"
                >
                  Download Overview
                </button>
              </div>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white/70 text-sm">Total Students</h3>
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-white">{reportData?.totalStudents || 0}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white/70 text-sm">Registered Companies</h3>
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-white">{companies.length}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white/70 text-sm">Avg ATS Score</h3>
                  <Award className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-white">{Math.round(reportData?.averageAtsScore || 0)}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white/70 text-sm">Job Ready</h3>
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-white">{reportData?.jobReadyCount || 0}</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Department Distribution */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Student Distribution by Department</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deptData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="department" stroke="rgba(255,255,255,0.6)" />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 18, 56, 0.95)",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Year Distribution */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Student Distribution by Year</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={yearData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ year, percent }) => `${year} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="year"
                    >
                      {yearData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 18, 56, 0.95)",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Registered Companies List */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Registered Companies</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-white font-semibold">Name</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Criteria (Min ATS)</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Allowed Departments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {companies.slice(0, 5).map((company) => (
                      <tr key={company._id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-white font-medium">{company.name}</td>
                        <td className="px-6 py-4 text-white/80">{company.criteria?.minAtsScore || 0}</td>
                        <td className="px-6 py-4 text-white/80">
                          {company.criteria?.allowedDepartments?.join(", ") || "All"}
                        </td>
                      </tr>
                    ))}
                    {companies.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-white/60">No companies registered yet.</td>
                        </tr>
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
