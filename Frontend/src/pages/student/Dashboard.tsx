import StudentSidebar from "@/components/student-sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  LogOut,
  User,
  GraduationCap,
  Briefcase,
  Zap,
  Award,
  Download,
  FileText,
  BarChart3,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { studentAPI } from "@/lib/api"
import type { StudentDashboardResponse } from "@/types/dashboard"

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<StudentDashboardResponse | null>(null)
  const [resumeData, setResumeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Use getMyResume instead of getDashboard since backend provides getMyResume
      // and we can derive dashboard stats from it.
      const res = await studentAPI.getMyResume()
      const resume = res.data
      
      setResumeData(resume)
      setDashboard({
        resumeStatus: resume.resumeCompletion === 100 ? "Completed" : "Pending",
        resumeCompletion: resume.resumeCompletion || 0,
        atsScore: resume.atsScore || 0,
        lastUpdated: resume.updatedAt || null
      })
    } catch (error: any) {
      // Handle 404 - no resume exists yet
      if (error.response?.status === 404) {
        setResumeData(null)
        setDashboard({
          resumeStatus: "Pending",
          resumeCompletion: 0,
          atsScore: 0,
          lastUpdated: null
        })
      } else {
        console.error("Failed to fetch dashboard data", error)
        // Set default values on error
        setDashboard({
          resumeStatus: "Pending",
          resumeCompletion: 0,
          atsScore: 0,
          lastUpdated: null
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const getSectionStatus = (section: string) => {
    if (!resumeData) return "Pending"
    
    switch(section) {
      case "Personal Information":
        return resumeData.personalInfo?.fullName ? "Completed" : "Pending"
      case "Education":
        return resumeData.education?.length > 0 ? "Completed" : "Pending"
      case "Skills":
        return resumeData.skills?.length > 0 ? "Completed" : "Pending"
      case "Projects":
        return resumeData.projects?.length > 0 ? "Completed" : "Pending"
      case "Certifications":
        return resumeData.certifications?.length > 0 ? "Completed" : "Pending"
      case "Download":
        return resumeData.selectedTemplate ? "Ready" : "Select Template"
      default:
        return "Pending"
    }
  }

  const resumeSections = [
    { icon: <User className="w-5 h-5" />, label: "Personal Information", path: "/student/profile" },
    { icon: <GraduationCap className="w-5 h-5" />, label: "Education", path: "/student/education" },
    { icon: <Zap className="w-5 h-5" />, label: "Skills", path: "/student/skills" },
    { icon: <Briefcase className="w-5 h-5" />, label: "Projects", path: "/student/projects" },
    { icon: <Award className="w-5 h-5" />, label: "Certifications", path: "/student/certifications" },
    { icon: <Download className="w-5 h-5" />, label: "Download", path: "/student/download" },
  ]

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
                <h1 className="text-xl font-bold">STON Technology</h1>
                <p className="text-xs text-white/60">Student Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
              <div className="text-sm font-medium">{user?.name || "Student"}</div>
              <div className="text-xs text-white/60">{user?.email}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {user?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "ST"}
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
        {/* Welcome Section */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2">Dashboard</h2>
            <p className="text-white/60">Welcome back to your placement journey</p>
          </div>
          {loading && <Loader2 className="w-8 h-8 animate-spin text-blue-500" />}
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Profile Completion */}
          <div className="bg-white/95 text-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="text-sm font-medium text-gray-600 mb-4">Profile Completion</div>
            <div className="text-5xl font-bold mb-6">{`${dashboard?.resumeCompletion ?? 0}%`}</div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-green-500 h-3 rounded-full" style={{ width: `${dashboard?.resumeCompletion ?? 0}%` }}></div>
            </div>
          </div>

          {/* ATS Score */}
          <div className="bg-white/95 text-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="text-sm font-medium text-gray-600 mb-4">ATS Score</div>
            <div className="text-5xl font-bold mb-2">{dashboard?.atsScore ?? 0}</div>
            <div className="text-sm text-gray-500">Above average</div>
          </div>

          {/* Resume Templates */}
          <div className="bg-white/95 text-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="text-sm font-medium text-gray-600 mb-4">Resume Templates</div>
            <div className="text-base text-gray-700 mt-12">3 templates available</div>
          </div>
        </div>

        {/* Resume Sections */}
        <div>
          <h3 className="text-2xl font-bold mb-6">Resume Sections</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resumeSections.map((section) => {
              const status = getSectionStatus(section.label)
              return (
              <div
                key={section.label}
                onClick={() => navigate(section.path)}
                className="bg-white/95 text-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer hover:scale-105"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                    {section.icon}
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${
                      status === "Completed" || status === "Ready"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800">{section.label}</h4>
                <p className="text-sm text-gray-500 mt-2">
                  {status === "Completed"
                    ? "✓ All done"
                    : status === "Ready"
                    ? "Ready to download"
                    : "Complete this section"}
                </p>
              </div>
            )})}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-8">
            <BarChart3 className="w-8 h-8 mb-4 text-blue-400" />
            <h4 className="text-xl font-bold mb-2">Browse Job Openings</h4>
            <p className="text-white/60 mb-4">Find and apply to positions matching your profile</p>
            <Button className="bg-white text-black hover:bg-gray-100" onClick={() => navigate("/student/jobs")}>
              View Openings
            </Button>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-8">
            <FileText className="w-8 h-8 mb-4 text-green-400" />
            <h4 className="text-xl font-bold mb-2">Resume Editor</h4>
            <p className="text-white/60 mb-4">Create and customize your professional resume</p>
            <Button className="bg-white text-black hover:bg-gray-100" onClick={() => navigate("/student/profile")}>
              Edit Resume
            </Button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
