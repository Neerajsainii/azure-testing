import HODSidebar from "@/components/hod-sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Users,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import NotificationBell from "@/components/NotificationBell"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { hodAPI } from "@/lib/api"
import type { HodDashboardResponse, ReportOverviewResponse, Activity } from "@/types/dashboard"

import CustomDropdown from "@/components/CustomDropdown"

export default function HODDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [hodData, setHodData] = useState<HodDashboardResponse | null>(null)
  const [reportData, setReportData] = useState<ReportOverviewResponse | null>(null)
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [sortBy, setSortBy] = useState("year")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const [selectedYear, setSelectedYear] = useState<string>("All Years")
  const [isLoading, setIsLoading] = useState(true)

  const handleLogout = async () => {
    await logout()
  }

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    const yearFilter = selectedYear !== "All Years" ? parseInt(selectedYear) : undefined

    Promise.all([
      hodAPI.getDashboard({ year: yearFilter, sortBy, order }),
      hodAPI.getReportOverview()
    ])
      .then(([dashboardRes, reportRes]) => {
        if (mounted) {
          setHodData(dashboardRes.data)
          setRecentActivities(dashboardRes.data.recentActivities || [])
          setReportData(reportRes.data)
        }
      })
      .catch((error) => {
        console.error("Failed to fetch dashboard data:", error)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [sortBy, order, selectedYear])

  const stats = [
    { label: "Total Students", value: String(reportData?.totalStudents ?? hodData?.totalStudents ?? 0), icon: <Users className="w-6 h-6" /> },
    { label: "Resumes Completed", value: String(reportData?.resumesCompletedCount ?? 0), icon: <CheckCircle2 className="w-6 h-6" /> },
    { label: "Job Ready", value: String(reportData?.jobReadyCount ?? 0), icon: <TrendingUp className="w-6 h-6" /> },
    { label: "Avg ATS Score", value: String(Math.round(reportData?.averageAtsScore ?? 0)), icon: <BookOpen className="w-6 h-6" /> },
  ]

  return (
    <div className="min-h-screen text-white">
      <HODSidebar />
      <div
        className="min-h-screen ml-64 pb-10"
        style={{
          background: "linear-gradient(135deg, rgba(5,6,22,1) 0%, rgba(15,26,63,1) 50%, rgba(26,46,102,1) 100%)",
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-50 app-header border-b border-white/10 backdrop-blur">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-teal-400" />
              <div>
                <h1 className="text-2xl font-bold">HOD Dashboard</h1>
                <p className="text-xs text-white/60">Head of Department</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm font-medium">Welcome, {user?.name || "HOD"}</div>
                <div className="text-xs text-white/60">{user?.email}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold border-2 border-teal-400/30">
                {user?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "HO"}
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
              <NotificationBell />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-8 py-10">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            </div>
          )}

          {!isLoading && (
            <>
              {/* Controls */}
              <div className="flex justify-end gap-4 mb-8">
                <CustomDropdown
                  items={["All Years", "1", "2", "3", "4"]}
                  value={selectedYear}
                  onChange={setSelectedYear}
                  placeholder="Filter by Year"
                />
                <CustomDropdown
                  items={["year", "date", "cgpa", "name"]}
                  value={sortBy}
                  onChange={setSortBy}
                  placeholder="Sort By"
                />
                <CustomDropdown
                  items={["asc", "desc"]}
                  value={order}
                  onChange={(val) => setOrder(val as "asc" | "desc")}
                  placeholder="Order"
                />
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center text-teal-400">
                        {stat.icon}
                      </div>
                    </div>
                    <p className="text-white/60 text-sm mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Department Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                <div className="lg:col-span-2 bg-white/5 border border-white/20 rounded-2xl p-8">
                  <h3 className="text-xl font-bold mb-6">Year-wise Student Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData?.distributionByYear || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="year" stroke="rgba(255,255,255,0.6)" label={{ value: "Year", position: "insideBottom", offset: -5, fill: "rgba(255,255,255,0.6)" }} />
                      <YAxis stroke="rgba(255,255,255,0.6)" label={{ value: "Students", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.6)" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0,0,0,0.8)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Quick Stats Card */}
                <div className="bg-white/5 border border-white/20 rounded-2xl p-8">
                  <h3 className="text-lg font-bold mb-6">Department Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-white/60 text-sm mb-2">Total Batches</p>
                      <p className="text-3xl font-bold text-teal-400">{reportData?.distributionByYear?.length || 0}</p>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-white/60 text-sm mb-2">Total Students</p>
                      <p className="text-3xl font-bold text-blue-400">{reportData?.totalStudents || 0}</p>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-white/60 text-sm mb-2">Completed Resumes</p>
                      <p className="text-3xl font-bold text-green-400">{reportData?.resumesCompletedCount || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white/5 border border-white/20 rounded-2xl p-8 mb-12">
                <h3 className="text-xl font-bold mb-6">Recent Student Activities</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-teal-600/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {activity.student.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{activity.student}</span>
                            <span className="text-white/60">•</span>
                            <span className="text-white/80">{activity.action}</span>
                          </div>
                          <p className="text-sm text-white/60">{activity.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-sm text-white/60">{activity.timestamp}</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${activity.status === "Completed"
                              ? "bg-green-500/20 text-green-400"
                              : activity.status === "In Progress"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                        >
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/20 rounded-2xl p-8 hover:bg-white/10 transition cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold">Student Management</h3>
                  </div>
                  <p className="text-sm text-white/60 mb-4">View and manage student profiles</p>
                  <Button onClick={() => navigate('/hod/students')} className="w-full bg-blue-600 hover:bg-blue-700">
                    Manage Students
                  </Button>
                </div>

                <div className="bg-white/5 border border-white/20 rounded-2xl p-8 hover:bg-white/10 transition cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-teal-400" />
                    </div>
                    <h3 className="text-lg font-bold">Placement Stats</h3>
                  </div>
                  <p className="text-sm text-white/60 mb-4">View placement statistics</p>
                  <Button onClick={() => navigate('/hod/placement-stats')} className="w-full bg-teal-600 hover:bg-teal-700">
                    View Statistics
                  </Button>
                </div>

                <div className="bg-white/5 border border-white/20 rounded-2xl p-8 hover:bg-white/10 transition cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold">Approvals</h3>
                  </div>
                  <p className="text-sm text-white/60 mb-4">Approve student profiles</p>
                  <Button onClick={() => navigate('/hod/approvals')} className="w-full bg-purple-600 hover:bg-purple-700">
                    Review Approvals
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
