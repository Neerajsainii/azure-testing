import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FileText,
  User,
  LogOut,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/hod-dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/hod/profile", icon: User },
  { label: "My Students", href: "/hod/students", icon: Users },
  { label: "Dept Placements", href: "/hod/placement-stats", icon: TrendingUp },
  { label: "Resume Status", href: "/hod/resume-status", icon: FileText },
]

export default function HODSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const rootClass = isMobile
    ? "relative h-full w-64 flex flex-col shadow-2xl border-r"
    : "hidden md:flex fixed left-0 top-0 h-screen w-64 flex flex-col shadow-2xl border-r"

  return (
    <aside
      className={rootClass}
      style={{
        background: "linear-gradient(180deg, #1e2a78 0%, #2d3a8c 25%, #1a1d3e 60%, #0f1238 100%)",
        borderColor: "rgba(20, 184, 166, 0.2)",
      }}
    >
      {/* Logo/Brand */}
      <div className="px-6 py-6 border-b border-teal-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">ST</span>
          </div>
          <div>
            <div className="text-white font-bold text-lg">STON Tech</div>
            <div className="text-xs text-teal-300 tracking-widest">HOD Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-2 px-4 py-6 text-sm overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + "/")
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.href)}
              className={`flex items-center gap-3 text-left px-4 py-3 rounded-lg border transition w-full ${isActive
                  ? "bg-teal-600/20 text-white border-teal-500/40 shadow-lg shadow-teal-500/10"
                  : "border-transparent hover:bg-teal-500/10 text-white/80 hover:text-white hover:border-teal-500/20"
                }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="px-4 py-4 border-t border-teal-500/20">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold">
            {user?.name?.charAt(0) || "H"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.name || "HOD"}</div>
            <div className="text-white/60 text-xs truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
