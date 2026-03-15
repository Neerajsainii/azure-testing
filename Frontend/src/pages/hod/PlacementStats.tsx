"use client"

import { TrendingUp, Users, Building2, Award } from "lucide-react"
import { useState, useEffect } from "react"
import HODSidebar from "@/components/hod-sidebar"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { hodAPI } from "@/lib/api"

export default function HODPlacementStatsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    hodAPI.getPlacementStats()
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !stats) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading stats...</div>
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
              <TrendingUp className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Placement Statistics</h1>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white/70 text-sm">Total Placed</h3>
                  <Users className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stats.totalPlaced ?? 0}</div>
                <p className="text-white/50 text-sm mt-1">Dept. students placed</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white/70 text-sm">Placement Rate</h3>
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-3xl font-bold text-teal-400">{stats.placementRate}%</div>
                <p className="text-white/60 text-sm mt-1">Eligible students</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white/70 text-sm">Partner Companies</h3>
                  <Building2 className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stats.partnerCompanies}</div>
                <p className="text-white/60 text-sm mt-1">Active recruiters</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white/70 text-sm">Avg Package</h3>
                  <Award className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stats.avgPackage ?? "N/A"}</div>
                <p className="text-white/50 text-sm mt-1">Based on offer letters</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Monthly Placement Trend */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Monthly Placement Trend</h3>
                {stats.monthlyData?.some((d: any) => d.placed > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
                      <YAxis stroke="rgba(255,255,255,0.6)" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 18, 56, 0.95)",
                          border: "1px solid rgba(20, 184, 166, 0.3)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Line type="monotone" dataKey="placed" stroke="#14b8a6" strokeWidth={3} dot={{ fill: "#14b8a6" }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-white/40 text-sm">No placement data for the last 6 months</div>
                )}
              </div>

              {/* Top Recruiters */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Top Recruiters</h3>
                {stats.companyData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.companyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="company" stroke="rgba(255,255,255,0.6)" tick={{ fontSize: 12 }} />
                      <YAxis stroke="rgba(255,255,255,0.6)" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 18, 56, 0.95)",
                          border: "1px solid rgba(20, 184, 166, 0.3)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="students" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-white/40 text-sm">No recruiter data available yet</div>
                )}
              </div>
            </div>

            {/* Package Distribution (table) - Simplified for now */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Package Distribution</h3>
              <p className="text-white/60">Data visualization coming soon based on real offer letters.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
// Removed PackageTable and hardcoded data

