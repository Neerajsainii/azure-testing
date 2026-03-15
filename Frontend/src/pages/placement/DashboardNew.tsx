import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Users,
  TrendingUp,
  Building2,
  Briefcase,
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
import { placementAPI } from "@/lib/api"

export default function PlacementDashboard() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    placedStudents: 0,
    companies: 0,
    openings: 0
  })
  const [departmentData, setDepartmentData] = useState<any[]>([])
  const [yearData, setYearData] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch Report Overview
        const report = await placementAPI.getReportOverview()
        
        // Fetch Companies and Drives for counts
        let drivesCount = 0
        
        try {
           const statsRes = await placementAPI.getStats()
           drivesCount = (statsRes.data as any).totalDrives || 0
        } catch (e) {
           console.error("Failed to fetch stats", e)
        }

        // Process Department Data
        const deptData = report.data.distributionByDepartment.map((d: any) => ({
          dept: d.department,
          students: d.count,
          placed: d.placed || 0 // Added placed in backend
        }))
        setDepartmentData(deptData)

        // Process Year Data
        const yData = report.data.distributionByYear.map((y: any) => ({
          year: y.year + " Year",
          students: y.count
        }))
        setYearData(yData)

        // Calculate Placed Students
        const totalPlaced = deptData.reduce((sum: number, d: any) => sum + d.placed, 0)

        setStats({
          totalStudents: report.data.totalStudents,
          placedStudents: totalPlaced,
          companies: 0, // Placeholder as we don't have API yet
          openings: drivesCount
        })

      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div
      className="min-h-screen text-white pb-10"
      style={{
        background: "linear-gradient(135deg, rgba(5,6,22,1) 0%, rgba(15,26,63,1) 50%, rgba(26,46,102,1) 100%)",
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] backdrop-blur">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Placement Dashboard</h1>
              <p className="text-xs text-white/60">Placement Officer</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm font-medium">Welcome, {user?.name || "Officer"}</div>
              <div className="text-xs text-white/60">{user?.email}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold border-2 border-purple-400/30">
              PO
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
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            value={loading ? "..." : stats.totalStudents.toLocaleString()}
            label="Total Students"
            color="bg-blue-500/20"
            iconColor="text-blue-400"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            value={loading ? "..." : stats.placedStudents.toLocaleString()}
            label="Placed Students"
            color="bg-green-500/20"
            iconColor="text-green-400"
          />
          <StatCard
            icon={<Building2 className="w-6 h-6" />}
            value={loading ? "..." : stats.companies.toString()}
            label="Companies"
            color="bg-purple-500/20"
            iconColor="text-purple-400"
          />
          <StatCard
            icon={<Briefcase className="w-6 h-6" />}
            value={loading ? "..." : stats.openings.toString()}
            label="Active Openings"
            color="bg-amber-500/20"
            iconColor="text-amber-400"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Student Distribution by Year */}
          <div className="bg-white/5 border border-white/20 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-6">Student Distribution by Year</h3>
            {loading ? <div className="text-center text-white/50">Loading...</div> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="year" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="students" name="Students" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>

          {/* Department-wise Placement */}
          <div className="bg-white/5 border border-white/20 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-6">Department-wise Placement</h3>
             {loading ? <div className="text-center text-white/50">Loading...</div> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="dept" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="students" name="Total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="placed" name="Placed" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  color,
  iconColor,
}: {
  icon: React.ReactNode
  value: string
  label: string
  color: string
  iconColor: string
}) {
  return (
    <div className={`${color} border border-white/10 rounded-2xl p-6`}>
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4 ${iconColor}`}>
        {icon}
      </div>
      <p className="text-white/60 text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
