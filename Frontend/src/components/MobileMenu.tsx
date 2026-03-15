import { useState, useMemo } from "react"
import { Menu, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import AdminSidebar from "@/components/admin-sidebar"
import PlacementSidebar from "@/components/placement-sidebar"
import PrincipalSidebar from "@/components/principal-sidebar"
import HODSidebar from "@/components/hod-sidebar"
import StudentSidebar from "@/components/student-sidebar"

export default function MobileMenu() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const SidebarComponent = useMemo(() => {
    switch (user?.role) {
      case "ADMIN":
        return AdminSidebar
      case "PLACEMENT":
        return PlacementSidebar
      case "PRINCIPAL":
        return PrincipalSidebar
      case "HOD":
        return HODSidebar
      case "STUDENT":
      default:
        return StudentSidebar
    }
  }, [user?.role])

  return (
    <>
      <button
        aria-label="Open menu"
        className="fixed top-4 left-4 z-50 md:hidden rounded-full bg-white/90 text-black shadow-lg border border-white/20 p-2 focus:outline-none focus:ring-2 focus:ring-white/40"
        onClick={() => setOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      <div
        className={`md:hidden fixed inset-0 z-50 transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 w-64 transform transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute top-3 right-3">
            <button
              aria-label="Close menu"
              className="rounded-full bg-white/90 text-black shadow border border-white/30 p-2"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <SidebarComponent isMobile />
        </div>
      </div>
    </>
  )
}
