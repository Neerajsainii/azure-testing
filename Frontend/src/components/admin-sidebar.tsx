import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  Building2,
  Users,
  FileText,
  Settings,
  User,
  LogOut,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/admin-dashboard", icon: Building2 },
  { label: "Profile", href: "/admin/profile", icon: User },
  { label: "Colleges", href: "/admin/colleges", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Department Limits", href: "/admin/department-limits", icon: Settings },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const rootClass = isMobile
    ? "relative w-64 h-full bg-gradient-to-b from-[#0f1238]/95 via-[#1a1a3e]/95 to-[#0b0f26]/95 backdrop-blur-xl border-r border-blue-500/20 flex flex-col py-6 px-4 gap-6 text-white shadow-2xl"
    : "hidden md:flex fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#0f1238]/95 via-[#1a1a3e]/95 to-[#0b0f26]/95 backdrop-blur-xl border-r border-blue-500/20 flex flex-col py-6 px-4 gap-6 text-white shadow-2xl"

  return (
    <aside className={rootClass}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 pb-4 border-b border-blue-500/20">
        <img src="/image/STON.png" alt="STON" className="w-12 h-12 rounded-lg object-cover" />
        <div className="leading-tight">
          <div className="text-lg font-bold text-white">STON Admin</div>
          <div className="text-xs text-blue-300 tracking-widest">Control Panel</div>
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
                  ? "bg-blue-600/20 text-white border-blue-500/40 shadow-lg shadow-blue-500/10"
                  : "border-transparent hover:bg-blue-500/10 text-white/80 hover:text-white hover:border-blue-500/20"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="pt-4 border-t border-blue-500/20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition font-semibold text-sm"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
