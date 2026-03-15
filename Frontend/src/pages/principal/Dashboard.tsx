import NotificationBell from "@/components/NotificationBell"
import PrincipalSidebar from "@/components/principal-sidebar"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
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
import { principalAPI } from "@/lib/api"
import type { PrincipalDashboardResponse, ReportOverviewResponse } from "@/types/dashboard"

export default function PrincipalDashboard() {
  const { user, logout } = useAuth()
  const [deptCount, setDeptCount] = useState(0)
  const [totalStudents, setTotalStudents] = useState(0)
  const [reportData, setReportData] = useState<ReportOverviewResponse | null>(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedDept, setSelectedDept] = useState("")
  const [grantEmail, setGrantEmail] = useState("")
  const [grantLoading, setGrantLoading] = useState(false)
  // Users list for granted access
  const [users, setUsers] = useState<any[]>([])
  const [reportActionLoading, setReportActionLoading] = useState(false)

  // Small local dropdown to avoid native white option panel on dark themes
  function CustomDropdown({ items, value, onChange, placeholder, labels }: { items: string[]; value: string; onChange: (v: string) => void; placeholder?: string; labels?: Record<string, string> }) {
    const [open, setOpen] = useState(false)
    return (
      <div className="relative mt-1">
        <button
          onClick={() => setOpen((v) => !v)}
          type="button"
          className="w-full text-left px-3 py-2 bg-transparent border border-white/10 rounded text-white flex items-center justify-between"
        >
          <span>{value ? (labels && labels[value]) || value : placeholder}</span>
          <svg className="w-4 h-4 text-white/60" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-full bg-[#0b1220] border border-white/10 rounded shadow-lg z-50">
            {items.map((it) => (
              <button
                key={it}
                onClick={() => {
                  onChange(it)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 hover:bg-white/5 transition ${it === value ? 'bg-white/5' : ''} text-white`}
              >
                {(labels && labels[it]) || it}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
  }

  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    let mounted = true

    // Fetch departments
    principalAPI.getDepartments()
      .then(res => {
        if (mounted && res.data) {
          setDepartments(res.data)
        }
      })
      .catch(err => console.error("Failed to fetch departments", err))

    principalAPI
      .getDashboard()
      .then((res) => {
        if (!mounted) return
        const data = res.data as PrincipalDashboardResponse
        setDeptCount((data as any).configuredDepartments ?? data.departmentsCount ?? 0)
        const total = (data.departments ?? []).reduce((sum, d) => sum + (d.totalStudents ?? 0), 0)
        setTotalStudents(total)
      })
      .catch(() => { })

    principalAPI
      .getReportOverview()
      .then((res) => {
        if (!mounted) return
        setReportData(res.data)
      })
      .catch(() => { })

    // Fetch users for Granted Access List
    principalAPI.getGrantedAccess().then(res => {
      if (!mounted) return
      const list = Array.isArray(res.data) ? res.data : []
      setUsers(list)
    }).catch((err) => {
      console.error("Failed to fetch users:", err)
      setUsers([])
    })

    return () => {
      mounted = false
    }
  }, [])

  const downloadReport = async (format: "csv" | "xlsx" | "pdf") => {
    try {
      setReportActionLoading(true)
      const res = await principalAPI.exportReport(format)
      const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `principal-report.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setReportActionLoading(false)
    }
  }

  const approveCurrentReport = async () => {
    try {
      setReportActionLoading(true)
      await principalAPI.approveReport("principal-overview")
      alert("Report approved")
    } catch {
      alert("Failed to approve report")
    } finally {
      setReportActionLoading(false)
    }
  }

  const handleGrantAccess = async () => {
    if (!selectedRole || !grantEmail) {
      alert("Please select a role and enter an email.")
      return
    }
    if (selectedRole === "hod" && !selectedDept) {
      alert("Please select a department for HOD.")
      return
    }

    try {
      setGrantLoading(true)

      if (selectedRole === "hod") {
        await principalAPI.createHod({ email: grantEmail, departmentId: selectedDept })
      } else if (selectedRole === "officer") {
        await principalAPI.createPlacementOfficer({ email: grantEmail })
      }

      alert("Access granted successfully!")

      // Refresh list
      const res = await principalAPI.getGrantedAccess()
      const list = Array.isArray(res.data) ? res.data : []
      setUsers(list)

      // Reset form
      setGrantEmail("")
      setSelectedRole("")
      setSelectedDept("")

    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || err.message || "Failed to grant access. Please try again.")
    } finally {
      setGrantLoading(false)
    }
  }

  const stats = [
    { label: "Total Students", value: String(reportData?.totalStudents ?? totalStudents), icon: <Users className="w-6 h-6" /> },
    { label: "Departments", value: String(deptCount), icon: <BookOpen className="w-6 h-6" /> },
    { label: "Resumes Completed", value: String(reportData?.resumesCompletedCount ?? 0), icon: <CheckCircle2 className="w-6 h-6" /> },
    { label: "Job Ready", value: String(reportData?.jobReadyCount ?? 0), icon: <AlertCircle className="w-6 h-6" /> },
  ]

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(135deg, rgba(5,6,22,1) 0%, rgba(15,26,63,1) 50%, rgba(26,46,102,1) 100%)",
      }}
    >
      <PrincipalSidebar />
      <div className="min-h-screen ml-64 pb-10">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">Principal Dashboard</h1>
                <p className="text-xs text-white/60">Principal</p>
              </div>
            </div>
            {/* removed settings icon per request; notifications moved next to logout */}
            <div className="flex-1" />
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm font-medium">Welcome, {user?.name || "Principal"}</div>
                <div className="text-xs text-white/60">{user?.email}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold border-2 border-indigo-400/30">
                PR
              </div>
              <div className="mr-2">
                <NotificationBell />
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
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-8 py-10">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 fade-in lift-on-hover soft-transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                    {stat.icon}
                  </div>
                </div>
                <p className="text-white/60 text-sm mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Department-wise Resume Completion Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-2 bg-white/5 border border-white/20 rounded-2xl p-8 slide-up">
              <h3 className="text-xl font-bold mb-6">Department-wise Student Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData?.distributionByDepartment || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="department" stroke="rgba(255,255,255,0.6)" />
                  <YAxis
                    stroke="rgba(255,255,255,0.6)"
                    label={{ value: "Students", angle: -90, position: "insideLeft" }}
                  />
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
            <div className="bg-white/5 border border-white/20 rounded-2xl p-8 fade-in lift-on-hover soft-transition">
              <h3 className="text-lg font-bold mb-6">Access Overview</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-white/60 text-sm mb-2">Granted Access</p>
                  <p className="text-3xl font-bold text-green-400">
                    {users.length}
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white/60 text-sm mb-2">Active Users</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {users.filter(u => u.status === 'active').length}
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white/60 text-sm mb-2">Departments</p>
                  <p className="text-3xl font-bold text-purple-400">{deptCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Granted Access List */}
          <div className="bg-white/5 border border-white/20 rounded-2xl p-8 mb-12 fade-in">
            <h3 className="text-xl font-bold mb-6">Granted Access List</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-semibold text-white/80">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-white/80">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-white/80">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-white/80">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((item) => (
                      <tr
                        key={item._id}
                        className="border-b border-white/10 hover:bg-white/5 transition"
                      >
                        <td className="py-3 px-4 text-white">{item.email}</td>
                        <td className="py-3 px-4 text-white/70 capitalize">{item.role}</td>
                        <td className="py-3 px-4 text-white/70">{item.department || "-"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-white/60">No access granted yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grant Access Section */}
          <div className="bg-white/5 border border-white/20 rounded-2xl p-8 slide-up">
            <h3 className="text-xl font-bold mb-6">Grant Access to User</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button disabled={reportActionLoading} className="bg-indigo-600 hover:bg-indigo-700" onClick={() => downloadReport("csv")}>Download CSV</Button>
              <Button disabled={reportActionLoading} className="bg-indigo-600 hover:bg-indigo-700" onClick={() => downloadReport("xlsx")}>Download XLSX</Button>
              <Button disabled={reportActionLoading} className="bg-indigo-600 hover:bg-indigo-700" onClick={() => downloadReport("pdf")}>Download PDF</Button>
              <Button disabled={reportActionLoading} className="bg-green-600 hover:bg-green-700" onClick={approveCurrentReport}>Approve Report</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Select Role</label>
                <CustomDropdown
                  items={["", "hod", "officer"]}
                  value={selectedRole}
                  onChange={setSelectedRole}
                  placeholder="Choose role..."
                  labels={{ "": "Choose role...", hod: "Head of Department", officer: "Placement Officer" }}
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Email</label>
                <input
                  type="email"
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Department</label>
                {selectedRole === "hod" ? (
                  departments.length > 0 ? (
                    <div className="relative mt-1">
                      <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="w-full text-left px-3 py-2 bg-[#0b1220] border border-white/10 rounded text-white focus:outline-none focus:border-blue-400"
                      >
                        <option value="">Choose department...</option>
                        {departments.map((d: any) => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="relative mt-1 px-3 py-2 border border-white/10 rounded text-white/60 text-sm">
                      No departments found. Please add departments first.
                    </div>
                  )
                ) : (
                  <div className="relative mt-1 px-3 py-2 border border-white/10 rounded text-white/60 text-sm">
                    Department not required for Placement Officer.
                  </div>
                )}
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleGrantAccess}
                  disabled={grantLoading || !selectedRole || !grantEmail || (selectedRole === "hod" && !selectedDept)}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-10"
                >
                  {grantLoading ? "Granting..." : "Grant Access"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
