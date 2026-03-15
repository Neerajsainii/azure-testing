
// import { useState, useEffect } from "react"
// import StudentSidebar from "@/components/student-sidebar"
// import { useAuth } from "@/contexts/AuthContext"
// import { useNavigate } from "react-router-dom"
// import { Button } from "@/components/ui/button"
// import {
//   LogOut,
//   Briefcase,
//   Building2,
//   Calendar,
//   Search,
//   Loader2,
//   AlertCircle
// } from "lucide-react"
// import { studentAPI } from "@/lib/api"
// import NotificationBell from "@/components/NotificationBell"

// interface Drive {
//   id: string
//   title: string
//   company: string
//   companyDescription: string
//   postedDate: string
//   criteria: {
//     minCgpa: number
//     allowedDepartments: string[]
//     allowedYears: number[]
//   }
//   status: string
// }

// export default function StudentJobs() {
//   const { user, logout } = useAuth()
//   const navigate = useNavigate()
//   const [drives, setDrives] = useState<Drive[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [searchTerm, setSearchTerm] = useState("")
//   const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

//   const handleLogout = async () => {
//     await logout()
//     navigate("/login", { replace: true })
//   }

//   useEffect(() => {
//     const fetchDrives = async () => {
//       try {
//         setLoading(true)
//         const res = await studentAPI.getOpenings()
//         setDrives(res.data.drives || [])
//       } catch (err: any) {
//         console.error("Failed to fetch openings", err)
//         setError(err.message || "Failed to load job openings")
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchDrives()
//   }, [])

//   const filteredDrives = drives.filter(drive => 
//     drive.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     drive.company.toLowerCase().includes(searchTerm.toLowerCase())
//   )

//   const handleApply = async (driveId: string, title: string) => {
//     try {
//       await studentAPI.applyToDrive(driveId)
//       const next = new Set(appliedIds)
//       next.add(driveId)
//       setAppliedIds(next)
//       alert(`Applied to "${title}" successfully`)
//     } catch (e: any) {
//       const msg = e?.response?.data?.message || e?.message || "Failed to apply"
//       alert(msg)
//     }
//   }

//   return (
//     <div className="min-h-screen text-white">
//       <StudentSidebar />
//       <div
//         className="min-h-screen ml-64 pb-10"
//         style={{
//           background: "linear-gradient(135deg, #0a0a18 0%, #0f1238 50%, #2e3cb3 100%)",
//         }}
//       >
//         {/* Header */}
//         <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
//           <div className="flex items-center justify-between px-8 py-4">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
//                 ST
//               </div>
//               <div>
//                 <h1 className="text-xl font-bold">Job Openings</h1>
//                 <p className="text-xs text-white/60">Find your dream job</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-6">
//               <NotificationBell />
//               <div className="text-right">
//                 <div className="text-sm font-medium">{user?.name || "Student"}</div>
//                 <div className="text-xs text-white/60">{user?.email}</div>
//               </div>
//               <Button
//                 onClick={handleLogout}
//                 variant="outline"
//                 size="sm"
//                 className="gap-2"
//               >
//                 <LogOut className="w-4 h-4" />
//                 Logout
//               </Button>
//             </div>
//           </div>
//         </header>

//         <div className="max-w-7xl mx-auto px-8 py-10">
//           {/* Search */}
//           <div className="mb-8 relative">
//             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
//             <input
//               type="text"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               placeholder="Search by role or company..."
//               className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition"
//             />
//           </div>

//           {/* Content */}
//           {loading ? (
//             <div className="flex justify-center py-20">
//               <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
//             </div>
//           ) : error ? (
//             <div className="text-center py-20 text-red-400 flex flex-col items-center gap-2">
//               <AlertCircle className="w-10 h-10" />
//               <p>{error}</p>
//             </div>
//           ) : filteredDrives.length === 0 ? (
//             <div className="text-center py-20 text-white/60">
//               <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
//               <p className="text-xl">No job openings found</p>
//               <p className="text-sm mt-2">Check back later for new opportunities</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 gap-6">
//               {filteredDrives.map((drive) => (
//                 <div
//                   key={drive.id}
//                   className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition group"
//                 >
//                   <div className="flex justify-between items-start">
//                     <div className="flex gap-4">
//                       <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-black font-bold text-xl">
//                         {drive.company.charAt(0)}
//                       </div>
//                       <div>
//                         <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition">
//                           {drive.title}
//                         </h3>
//                         <div className="flex items-center gap-2 text-white/60 mt-1">
//                           <Building2 className="w-4 h-4" />
//                           <span>{drive.company}</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex flex-col items-end gap-2">
//                       <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
//                         Active
//                       </span>
//                       <span className="text-xs text-white/40 flex items-center gap-1">
//                         <Calendar className="w-3 h-3" />
//                         {new Date(drive.postedDate).toLocaleDateString()}
//                       </span>
//                     </div>
//                   </div>

//                   <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div className="bg-white/5 rounded-lg p-3">
//                       <p className="text-white/40 text-xs mb-1">Min CGPA</p>
//                       <p className="font-semibold">{drive.criteria.minCgpa}</p>
//                     </div>
//                     <div className="bg-white/5 rounded-lg p-3">
//                       <p className="text-white/40 text-xs mb-1">Departments</p>
//                       <p className="font-semibold truncate" title={drive.criteria.allowedDepartments.join(", ")}>
//                         {drive.criteria.allowedDepartments.length > 0 ? drive.criteria.allowedDepartments.join(", ") : "All"}
//                       </p>
//                     </div>
//                     <div className="bg-white/5 rounded-lg p-3">
//                       <p className="text-white/40 text-xs mb-1">Eligible Years</p>
//                       <p className="font-semibold">
//                         {drive.criteria.allowedYears && drive.criteria.allowedYears.length > 0 
//                           ? drive.criteria.allowedYears.join(", ") 
//                           : "All Years"}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="mt-6 flex justify-end">
//                     <Button
//                       className="bg-blue-600 hover:bg-blue-700"
//                       aria-label={`Apply to drive ${drive.title}`}
//                       disabled={appliedIds.has(drive.id) || drive.status !== "open"}
//                       onClick={() => handleApply(drive.id, drive.title)}
//                     >
//                       {appliedIds.has(drive.id) ? "Applied" : "Apply Now"}
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }


import { useState, useEffect } from "react"
import StudentSidebar from "@/components/student-sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Briefcase,
  Building2,
  Calendar,
  Search,
  Loader2,
  AlertCircle
} from "lucide-react"
import { studentAPI } from "@/lib/api"
import NotificationBell from "@/components/NotificationBell"

interface Drive {
  id: string
  title: string
  company: string
  companyDescription: string
  postedDate: string
  criteria: {
    minCgpa: number
    allowedDepartments: string[]
    allowedYears: number[]
  }
  status: string
}

export default function StudentJobs() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [drives, setDrives] = useState<Drive[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const [openingsRes, applicationsRes] = await Promise.all([
          studentAPI.getOpenings(),
          studentAPI.getApplications()
        ])

        setDrives(openingsRes.data.drives || [])

        // Pre-populate applied drive IDs so buttons show correct state on load
        const alreadyApplied = new Set<string>(
          (applicationsRes.data.applications || []).map((a: any) => String(a.driveId))
        )
        setAppliedIds(alreadyApplied)

      } catch (err: any) {
        console.error("Failed to fetch data", err)
        setError(err.message || "Failed to load job openings")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredDrives = drives.filter(drive => 
    drive.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drive.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleApply = async (driveId: string, title: string) => {
    try {
      await studentAPI.applyToDrive(driveId)
      const next = new Set(appliedIds)
      next.add(driveId)
      setAppliedIds(next)
      alert(`Applied to "${title}" successfully`)
    } catch (e: any) {
      if (e?.response?.status === 409) {
        // Already applied — just mark button as applied
        const next = new Set(appliedIds)
        next.add(driveId)
        setAppliedIds(next)
        return
      }
      const msg = e?.response?.data?.message || e?.message || "Failed to apply"
      alert(msg)
    }
  }

  return (
    <div className="min-h-screen text-white">
      <StudentSidebar />
      <div
        className="min-h-screen ml-64 pb-10"
        style={{
          background: "linear-gradient(135deg, #0a0a18 0%, #0f1238 50%, #2e3cb3 100%)",
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                ST
              </div>
              <div>
                <h1 className="text-xl font-bold">Job Openings</h1>
                <p className="text-xs text-white/60">Find your dream job</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <NotificationBell />
              <div className="text-right">
                <div className="text-sm font-medium">{user?.name || "Student"}</div>
                <div className="text-xs text-white/60">{user?.email}</div>
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
          {/* Search */}
          <div className="mb-8 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by role or company..."
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-400 flex flex-col items-center gap-2">
              <AlertCircle className="w-10 h-10" />
              <p>{error}</p>
            </div>
          ) : filteredDrives.length === 0 ? (
            <div className="text-center py-20 text-white/60">
              <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">No job openings found</p>
              <p className="text-sm mt-2">Check back later for new opportunities</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredDrives.map((drive) => (
                <div
                  key={drive.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-black font-bold text-xl">
                        {drive.company.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition">
                          {drive.title}
                        </h3>
                        <div className="flex items-center gap-2 text-white/60 mt-1">
                          <Building2 className="w-4 h-4" />
                          <span>{drive.company}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
                        Active
                      </span>
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(drive.postedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">Min CGPA</p>
                      <p className="font-semibold">{drive.criteria.minCgpa}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">Departments</p>
                      <p className="font-semibold truncate" title={drive.criteria.allowedDepartments.join(", ")}>
                        {drive.criteria.allowedDepartments.length > 0 ? drive.criteria.allowedDepartments.join(", ") : "All"}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">Eligible Years</p>
                      <p className="font-semibold">
                        {drive.criteria.allowedYears && drive.criteria.allowedYears.length > 0 
                          ? drive.criteria.allowedYears.join(", ") 
                          : "All Years"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      aria-label={`Apply to drive ${drive.title}`}
                      disabled={appliedIds.has(drive.id) || drive.status !== "open"}
                      onClick={() => handleApply(drive.id, drive.title)}
                    >
                      {appliedIds.has(drive.id) ? "Applied" : "Apply Now"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
