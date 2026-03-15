import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  Briefcase,
  Users,
  User,
  LogOut,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/placement-dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/placement/profile", icon: User },
  { label: "Placement Overview", href: "/placement/overview", icon: TrendingUp },
  { label: "Departments", href: "/placement/department", icon: Building2 },
  { label: "Top Companies", href: "/placement/companies", icon: Building2 },
  { label: "Job Openings", href: "/placement/openings", icon: Briefcase },
  { label: "Student Records", href: "/placement/students", icon: Users },
]

export default function PlacementSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const rootClass = isMobile
    ? "relative w-64 h-full bg-gradient-to-b from-[#0f1238]/95 via-[#1a1a3e]/95 to-[#0b0f26]/95 backdrop-blur-xl border-r border-purple-500/20 flex flex-col py-6 px-4 gap-6 text-white shadow-2xl"
    : "hidden md:flex fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#0f1238]/95 via-[#1a1a3e]/95 to-[#0b0f26]/95 backdrop-blur-xl border-r border-purple-500/20 flex flex-col py-6 px-4 gap-6 text-white shadow-2xl"

  return (
    <aside className={rootClass}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 pb-4 border-b border-purple-500/20">
        <img src="/image/STON.png" alt="STON" className="w-12 h-12 rounded-lg object-cover" />
        <div className="leading-tight">
          <div className="text-lg font-bold text-white">STON Placement</div>
          <div className="text-xs text-purple-300 tracking-widest">Officer</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-2 text-sm overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + "/")
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.href)}
              className={`flex items-center gap-3 text-left px-4 py-3 rounded-lg border transition w-full ${
                isActive
                  ? "bg-purple-600/20 text-white border-purple-500/40 shadow-lg shadow-purple-500/10"
                  : "border-transparent hover:bg-purple-500/10 text-white/80 hover:text-white hover:border-purple-500/20"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Logout + Notifications */}
      <div className="pt-4 border-t border-purple-500/20 flex items-center justify-between gap-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-left px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition font-semibold text-sm"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
