import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import PlacementSidebar from "@/components/placement-sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { LogOut, Briefcase, Users, TrendingUp, FileText, Search, Loader2 } from "lucide-react"
import NotificationBell from "@/components/NotificationBell"
import { placementAPI } from "@/lib/api"
import type { PlacementDashboardResponse, ReportOverviewResponse } from "@/types/dashboard"
import CustomDropdown from "@/components/CustomDropdown"

export default function PlacementDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [placementData, setPlacementData] = useState<PlacementDashboardResponse | null>(null)
  const [reportData, setReportData] = useState<ReportOverviewResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Filtering states
  const [sortBy, setSortBy] = useState<string>("cgpa")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const [selectedYear, setSelectedYear] = useState<string>("All Years")
  const [department, setDepartment] = useState<string>("All Departments")
  const [minCGPA, setMinCGPA] = useState<string>("")
  const [availableDepartments, setAvailableDepartments] = useState<string[]>(["All Departments"])

  // AI Matching States
  const [jdText, setJdText] = useState("")
  const [isMatching, setIsMatching] = useState(false)
  const [matchedCandidates, setMatchedCandidates] = useState<any[]>([])
  const [showMatchResults, setShowMatchResults] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  const handleAiMatch = async () => {
    if (!jdText.trim()) return
    try {
      setIsMatching(true)
      setShowMatchResults(true)
      const res = await placementAPI.matchCandidates(jdText)
      setMatchedCandidates(res.data.candidates || [])
    } catch (error) {
      console.error("Failed to match candidates", error)
      alert("Failed to find matching candidates")
    } finally {
      setIsMatching(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const yearFilter = selectedYear !== "All Years" ? parseInt(selectedYear) : undefined
    const deptFilter = department !== "All Departments" ? department : undefined
    const cgpaFilter = minCGPA ? parseFloat(minCGPA) : undefined

    Promise.all([
      placementAPI.getDashboard({ 
        year: yearFilter, 
        department: deptFilter,
        minCGPA: cgpaFilter,
        sortBy, 
        order 
      }),
      placementAPI.getReportOverview()
    ]).then(([dashboardRes, reportRes]) => {
      if (mounted) {
        setPlacementData(dashboardRes.data)
        setReportData(reportRes.data)
      }
    }).catch(console.error)
    .finally(() => {
      if (mounted) setIsLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [sortBy, order, selectedYear, department, minCGPA])

  useEffect(() => {
    let mounted = true
    placementAPI.getDepartments()
      .then((res: any) => {
        const list: string[] = Array.isArray(res.data)
          ? res.data
          : (res.data?.departments || [])
        if (mounted) {
          const normalized = list
            .filter(Boolean)
            .map((d: any) => (typeof d === "string" ? d : (d?.name ?? "")))
            .filter((n: string) => n && n.trim().length > 0)
          setAvailableDepartments(["All Departments", ...normalized])
        }
      })
      .catch(() => {
        setAvailableDepartments(["All Departments"])
      })
    return () => {
      mounted = false
    }
  }, [])
  return (
    <div className="min-h-screen text-white">
      <PlacementSidebar />
      <div className="min-h-screen ml-64 bg-gradient-to-br from-[#0b0424] via-[#1a0f4a] to-[#2b1d77]">
        {/* Header */}
        <header className="border-b border-white/10 bg-white/5 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">STON Technology</h1>
              <p className="text-white/60 text-sm">Placement Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="text-right">
                <p className="text-white font-medium">{user?.name || "Placement Officer"}</p>
                <p className="text-white/60 text-sm">{user?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                {user?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "PO"}
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          
          {/* AI Job Matching Section */}
          <div className="mb-12 bg-white/5 border border-white/10 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-400" />
              AI Candidate Match
            </h2>
            <p className="text-white/60 mb-6">
              Paste a Job Description below to find the most eligible students from the entire college using AI matching.
            </p>
            <div className="flex gap-4 items-start">
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste Job Description here (e.g. We are looking for a React Developer with Node.js experience...)"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg p-4 text-white min-h-[120px] focus:outline-none focus:border-indigo-500"
              />
              <Button 
                onClick={handleAiMatch} 
                disabled={isMatching || !jdText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6"
              >
                {isMatching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
                Find Candidates
              </Button>
            </div>

            {/* Match Results */}
            {showMatchResults && (
              <div className="mt-8 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-xl font-semibold mb-4">
                  Top Matches {matchedCandidates.length > 0 && `(${matchedCandidates.length})`}
                </h3>
                {matchedCandidates.length === 0 ? (
                  <div className="text-center py-8 text-white/50 bg-white/5 rounded-lg">
                    No matching candidates found above the threshold.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {matchedCandidates.map((candidate: any) => (
                      <div key={candidate.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition">
                        <div>
                          <h4 className="font-bold text-lg text-white">{candidate.name}</h4>
                          <p className="text-sm text-white/60">{candidate.department} • Year {candidate.year} • CGPA: {candidate.cgpa}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {candidate.skillsMatched?.slice(0, 5).map((skill: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-indigo-400">{candidate.matchScore}%</div>
                          <p className="text-xs text-white/50">Match Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Placement Operations
              </h2>
              <p className="text-white/60">
                Manage job openings, companies, and student placements
              </p>
            </div>
            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
               {/* Existing filters... */}
               <CustomDropdown
                items={availableDepartments}
                value={department}
                onChange={setDepartment}
                placeholder="Filter by Dept"
              />
              <CustomDropdown
                items={["All Years", "1", "2", "3", "4"]}
                value={selectedYear}
                onChange={setSelectedYear}
                placeholder="Filter by Year"
              />
               <input 
                type="number" 
                placeholder="Min CGPA" 
                className="bg-white/10 text-white border border-white/10 rounded-md px-3 py-2 text-sm w-24"
                value={minCGPA}
                onChange={(e) => setMinCGPA(e.target.value)}
              />
               <CustomDropdown
                items={["cgpa", "name", "year"]}
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
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition">
              <div className="flex items-center justify-between mb-4">
                <Briefcase className="w-8 h-8 text-blue-400" />
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                  Active
                </span>
              </div>
              <p className="text-white/60 text-sm mb-1">Job Openings</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? "..." : (placementData?.activeJobsCount || 0)}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-green-400" />
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                  Registered
                </span>
              </div>
              <p className="text-white/60 text-sm mb-1">Total Students</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? "..." : (reportData?.totalStudents ?? placementData?.totalStudents ?? 0)}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                  Progress
                </span>
              </div>
              <p className="text-white/60 text-sm mb-1">Resumes Completed</p>
              <p className="text-3xl font-bold text-white">{reportData?.resumesCompletedCount ?? 0}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-amber-400" />
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded">
                  Qualified
                </span>
              </div>
              <p className="text-white/60 text-sm mb-1">Job Ready</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? "..." : (reportData?.jobReadyCount ?? 0)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 hover:border-indigo-500/50 transition cursor-pointer" onClick={() => navigate("/placement/companies")}>
              <h3 className="text-xl font-bold text-white mb-4">Companies</h3>
              <p className="text-white/60 mb-6">
                Manage registered companies and job postings
              </p>
              <Button className="w-full bg-white text-black hover:bg-gray-100">
                Manage Companies
              </Button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-8 hover:border-indigo-500/50 transition cursor-pointer" onClick={() => navigate("/placement/students")}>
              <h3 className="text-xl font-bold text-white mb-4">Candidates</h3>
              <p className="text-white/60 mb-6">
                Review student profiles and applications
              </p>
              <Button className="w-full bg-white text-black hover:bg-gray-100">
                View Candidates
              </Button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-8 hover:border-indigo-500/50 transition cursor-pointer" onClick={() => navigate("/placement/openings")}>
              <h3 className="text-xl font-bold text-white mb-4">Job Openings</h3>
              <p className="text-white/60 mb-6">
                Create and manage job openings
              </p>
              <Button className="w-full bg-white text-black hover:bg-gray-100">
                Post Job Opening
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
