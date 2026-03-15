// import { useBackendSession } from "@/contexts/BackendSessionContext"
import { Link } from "react-router-dom"

export default function StandaloneDashboard() {
  // const { session } = useBackendSession()

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0b0424] via-[#1a0f4a] to-[#2b1d77] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">Standalone Student Dashboard</h1>
        <p className="mt-2 text-white/70">
          You can use resume tools and AI features, but you won’t see any college/admin dashboards.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition" to="/student-dashboard">
            Resume Builder
          </Link>
          <Link className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition" to="/student/ats">
            ATS + Skill Gap
          </Link>
        </div>
      </div>
    </main>
  )
}
