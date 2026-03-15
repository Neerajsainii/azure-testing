import { useState, useEffect } from "react"
import AdminSidebar from "@/components/admin-sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Building2,
  Users,
  Activity,
  Lock,
  CheckCircle2,
  Clock,
  ChevronDown,
  User2,
  Calendar
} from "lucide-react"
import { adminAPI } from "@/lib/api"
import type { ReportOverviewResponse } from "@/types/dashboard"
import NotificationBell from "@/components/NotificationBell"

function formatTimeAgo(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} mins ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  return d.toLocaleDateString()
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "S"
}

function StatsCard({ title, value, icon, statusIcon }: any) {
  return (
    <div className="bg-[#1a163f]/60 rounded-xl border border-white/5 p-6">
      <div className="flex justify-between mb-4">
        {icon || <div />}
        {statusIcon}
      </div>
      <div className="text-sm text-white/60">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}

interface ContactQuery {
  _id: string
  name: string
  email: string
  college?: string | null
  message: string
  status: string
  createdAt: string
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [reportData, setReportData] = useState<ReportOverviewResponse | null>(null)
  const [platformOverview, setPlatformOverview] = useState<any>(null)
  const [activities, setActivities] = useState<Array<{ admin: string; action: string; details: string; timestamp: string; initials: string; color: string }>>([])
  const [contactQueries, setContactQueries] = useState<ContactQuery[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      adminAPI.getReportOverview().then((res) => setReportData(res.data)),
      adminAPI.getPlatformOverview().then((res) => setPlatformOverview(res.data)),
      adminAPI.getDashboard()
        .then((res) => {
          const logs = (res.data?.recentAuditLogs || []) as Array<{ admin?: string; action?: string; details?: string; timestamp?: string }>
          setActivities(
            logs.map((log) => ({
              admin: log.admin || "System",
              action: log.action || "",
              details: log.details || log.action || "",
              timestamp: log.timestamp ? formatTimeAgo(log.timestamp) : "",
              initials: getInitials(log.admin || "System"),
              color: "bg-blue-500",
            }))
          )
        })
        .catch(() => setActivities([])),
      adminAPI.getContactQueries().then(res => setContactQueries(res.data.queries || [])).catch(() => setContactQueries([]))
    ])
      .catch((error) => {
        console.error("Failed to fetch dashboard data:", error)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen text-white">
      <AdminSidebar />

      <div
        className="min-h-screen ml-64 pb-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(5,6,22,1) 0%, rgba(15,26,63,1) 50%, rgba(26,46,102,1) 100%)",
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-blue-400" />
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            </div>

            <div className="flex items-center gap-4 relative">
              <div className="text-sm font-medium text-white/90">Welcome, {user?.name || "Admin"}</div>

              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                {getInitials(user?.name || "SA")}
              </div>

              <div className="flex items-center gap-3">
                <NotificationBell />

                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 rounded-full"
                >
                  Admin Panel
                  <ChevronDown size={16} />
                </button>
              </div>

              {open && (
                <div className="absolute right-0 top-14 w-48 bg-[#1a163f] border border-white/10 rounded-xl shadow-lg z-50">
                  <button
                    onClick={() => navigate("/admin/profile")}
                    className="w-full px-4 py-2 flex items-center gap-2 hover:bg-white/5"
                  >
                    <User2 size={16} /> Profile
                  </button>

                  <button
                    onClick={() => navigate("/admin/settings")}
                    className="w-full px-4 py-2 flex items-center gap-2 hover:bg-white/5"
                  >
                    <Lock size={16} /> Change Password
                  </button>

                  <button
                    onClick={() => navigate("/admin/audit-logs")}
                    className="w-full px-4 py-2 flex items-center gap-2 hover:bg-white/5"
                  >
                    <Activity size={16} /> Activity Logs
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 flex items-center gap-2 hover:bg-red-500/10 text-red-400"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8">
          <h2 className="text-lg font-medium mb-6">Overview</h2>
          {platformOverview && (
            <div className="mb-4 text-sm text-white/70">
              Departments: {platformOverview.totalDepartments ?? 0} | Principals: {platformOverview.totalPrincipals ?? 0} | Pending Invites: {platformOverview.pendingInvites ?? 0}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatsCard
              title="Total Students"
              value={reportData?.totalStudents ?? "0"}
              icon={<Users size={22} />}
              statusIcon={<CheckCircle2 size={22} className="text-blue-500" />}
            />

            <StatsCard 
              title="Resumes Completed" 
              value={reportData?.resumesCompletedCount ?? "0"} 
              statusIcon={<CheckCircle2 size={22} className="text-green-500" />} 
            />

            <StatsCard 
              title="Job Ready" 
              value={reportData?.jobReadyCount ?? "0"} 
              statusIcon={<CheckCircle2 size={22} className="text-purple-500" />} 
            />

            <StatsCard 
              title="Avg ATS Score" 
              value={reportData?.averageAtsScore ? Math.round(reportData.averageAtsScore) : "0"} 
              icon={<Activity size={24} />} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Queries Section */}
              <div className="bg-[#1a163f]/60 rounded-xl border border-white/5">
                <div className="p-6 font-semibold flex items-center justify-between">
                  <span>Contact Us Requests</span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">{contactQueries.length} New</span>
                </div>

                {contactQueries.length === 0 ? (
                  <div className="px-6 py-8 text-center text-white/50">No contact requests</div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    {contactQueries.map((query, i) => (
                      <div key={i} className="px-6 py-4 border-t border-white/5 hover:bg-white/5 transition">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold text-white">{query.name}</div>
                            <div className="text-xs text-white/60">{query.email}</div>
                          </div>
                          <div className="text-xs text-white/40 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(query.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {query.college ? (
                          <div className="mb-1 font-medium text-sm text-blue-300">{query.college}</div>
                        ) : null}
                        <div className="text-sm text-white/70 line-clamp-2">{query.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white/5 border border-white/20 rounded-2xl p-8 hover:bg-white/10 transition">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Lock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Settings</h3>
                    <p className="text-sm text-white/60">Configure system settings</p>
                  </div>
                </div>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={() => navigate("/admin/settings")}
                >
                  System Settings
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6" /> Recent Activities
              </h3>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="p-4 text-center text-white/50">No recent activity</div>
                ) : (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition">
                    <div className={`w-10 h-10 rounded-full ${activity.color} flex items-center justify-center text-sm font-bold flex-shrink-0`}>{activity.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{activity.admin}</span>
                        <span className="text-white/60">•</span>
                        <span className="text-white/80">{activity.action}</span>
                      </div>
                      <p className="text-sm text-white/60">{activity.details}</p>
                    </div>
                    <div className="text-sm text-white/60 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-4 h-4" /> {activity.timestamp}
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>
          </div>
          {!platformOverview && (
            <div className="mt-4 px-4 py-3 rounded-lg border border-red-500/40 bg-red-500/15 text-red-200">
              Failed to load platform overview. Ensure you are logged in as Platform Admin and backend is reachable.
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  )
}
