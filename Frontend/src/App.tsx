import { Routes, Route, Navigate } from "react-router-dom"
import { Suspense, lazy } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { BackendSessionProvider } from "@/contexts/BackendSessionContext"
import { AuthProvider } from "@/contexts/AuthContext"
import MobileMenu from "@/components/MobileMenu"

// Pages
import LandingPage from "./pages/LandingPage"
import Login from "./pages/Login.tsx"
import AdministrationLogin from "./pages/AdministrationLogin"
import MainLogin from "./pages/MainLogin"
const Register = lazy(() => import("./pages/Register"))
const StandaloneDashboard = lazy(() => import("./pages/standalone/Dashboard"))

// Dashboard Pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"))
const PlacementDashboard = lazy(() => import("./pages/placement/Dashboard"))
const PrincipalDashboard = lazy(() => import("./pages/principal/Dashboard"))
const HODDashboard = lazy(() => import("./pages/hod/Dashboard"))
const StudentDashboard = lazy(() => import("./pages/student/Dashboard"))

// Student Pages
const StudentProfile = lazy(() => import("./pages/student/Profile"))
const StudentEducation = lazy(() => import("./pages/student/Education"))
const StudentProjects = lazy(() => import("./pages/student/Projects"))
const StudentSkills = lazy(() => import("./pages/student/Skills"))
const StudentCertifications = lazy(() => import("./pages/student/Certifications"))
const StudentTemplates = lazy(() => import("./pages/student/Templates"))
const StudentATS = lazy(() => import("./pages/student/ATS"))
const StudentDownload = lazy(() => import("./pages/student/Download"))
const StudentJobs = lazy(() => import("./pages/student/Jobs"))
const StudentApplications = lazy(() => import("./pages/student/Applications"))

// Admin Pages
const AdminColleges = lazy(() => import("./pages/admin/Colleges"))
const AdminUsers = lazy(() => import("./pages/admin/Users"))
const AdminAuditLogs = lazy(() => import("./pages/admin/AuditLogs"))
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"))
const AdminProfile = lazy(() => import("./pages/admin/Profile"))
const AdminDepartmentLimits = lazy(() => import("./pages/admin/DepartmentLimits"))

// Placement Pages
const PlacementCompanies = lazy(() => import("./pages/placement/Companies"))
const PlacementOpenings = lazy(() => import("./pages/placement/Openings"))
const PlacementStudents = lazy(() => import("./pages/placement/Students"))
const PlacementOverview = lazy(() => import("./pages/placement/Overview"))
const PlacementDepartment = lazy(() => import("./pages/placement/Department"))
const PlacementProfile = lazy(() => import("./pages/placement/Profile"))
const PlacementDriveCandidates = lazy(() => import("./pages/placement/DriveCandidates"))

// Principal Pages
const PrincipalStudentRecords = lazy(() => import("./pages/principal/StudentRecords"))
const PrincipalGrantedAccess = lazy(() => import("./pages/principal/GrantedAccess"))
const PrincipalDepartmentStatus = lazy(() => import("./pages/principal/DepartmentStatus"))
const PrincipalStudentResumeStatus = lazy(() => import("./pages/principal/StudentResumeStatus"))
const PrincipalDownload = lazy(() => import("./pages/principal/Download"))
const PrincipalProfile = lazy(() => import("./pages/principal/Profile"))
const PrincipalAuditLogs = lazy(() => import("./pages/principal/AuditLogs"))

// HOD Pages
const HODStudents = lazy(() => import("./pages/hod/Students"))
const HODPlacementStats = lazy(() => import("./pages/hod/PlacementStats"))
const HODResumeStatus = lazy(() => import("./pages/hod/ResumeStatus"))
const HODApprovals = lazy(() => import("./pages/hod/Approvals"))
const HODProfile = lazy(() => import("./pages/hod/Profile"))

const AccessDenied = () => (
  <div className="p-6 text-white text-center font-bold uppercase">
    Unauthorized access — Your IP is logged. Go back.
  </div>
)

function App() {
  return (
    <BackendSessionProvider>
      <AuthProvider>
        <MobileMenu />
        <Suspense fallback={<div className="p-6 text-white text-center">Loading...</div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/administration" element={<AdministrationLogin />} />
            <Route path="/administration-login" element={<Navigate to="/administration" replace />} />
            <Route path="/main" element={<MainLogin />} />
            <Route path="/Placement" element={<Navigate to="/placement-dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
            <Route path="/hod" element={<Navigate to="/hod-dashboard" replace />} />
            <Route path="/principal" element={<Navigate to="/principal-dashboard" replace />} />
            <Route path="/placement" element={<Navigate to="/placement-dashboard" replace />} />
            <Route path="/student" element={<Navigate to="/student-dashboard" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<Navigate to="/login" replace />} />
            <Route
              path="/standalone/dashboard"
              element={
                <ProtectedRoute>
                  <StandaloneDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="/admin/dashboard" element={<Navigate to="/admin-dashboard" replace />} />
            <Route path="/principal/dashboard" element={<Navigate to="/principal-dashboard" replace />} />
            <Route path="/hod/dashboard" element={<Navigate to="/hod-dashboard" replace />} />
            <Route path="/placement/dashboard" element={<Navigate to="/placement-dashboard" replace />} />

            {/* Protected Routes - Placement Team */}
            <Route
              path="/placement-dashboard"
              element={
                <ProtectedRoute>
                  <PlacementDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/placement/profile"
              element={
                <ProtectedRoute>
                  <PlacementProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/placement/companies"
              element={
                <ProtectedRoute>
                  <PlacementCompanies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/placement/openings"
              element={
                <ProtectedRoute>
                  <PlacementOpenings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/placement/students"
              element={
                <ProtectedRoute>
                  <PlacementStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/placement/overview"
              element={
                <ProtectedRoute>
                  <PlacementOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/placement/department"
              element={
                <ProtectedRoute>
                  <PlacementDepartment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/placement/drives/:id/candidates"
              element={
                <ProtectedRoute>
                  <PlacementDriveCandidates />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Principal/HOD */}
            <Route
              path="/principal-dashboard"
              element={
                <ProtectedRoute>
                  <PrincipalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/principal/profile"
              element={
                <ProtectedRoute>
                  <PrincipalProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/principal/student-records"
              element={
                <ProtectedRoute>
                  <PrincipalStudentRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/principal/granted-access"
              element={
                <ProtectedRoute>
                  <PrincipalGrantedAccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/principal/department-status"
              element={
                <ProtectedRoute>
                  <PrincipalDepartmentStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/principal/student-resume-status"
              element={
                <ProtectedRoute>
                  <PrincipalStudentResumeStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/principal/download"
              element={
                <ProtectedRoute>
                  <PrincipalDownload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/principal/audit-logs"
              element={
                <ProtectedRoute>
                  <PrincipalAuditLogs />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - HOD */}
            <Route
              path="/hod-dashboard"
              element={
                <ProtectedRoute>
                  <HODDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/profile"
              element={
                <ProtectedRoute>
                  <HODProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/students"
              element={
                <ProtectedRoute>
                  <HODStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/placement-stats"
              element={
                <ProtectedRoute>
                  <HODPlacementStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/resume-status"
              element={
                <ProtectedRoute>
                  <HODResumeStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/approvals"
              element={
                <ProtectedRoute>
                  <HODApprovals />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Admin */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute>
                  <AdminProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/colleges"
              element={
                <ProtectedRoute>
                  <AdminColleges />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/department-limits"
              element={
                <ProtectedRoute>
                  <AdminDepartmentLimits />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Student */}
            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/education"
              element={
                <ProtectedRoute>
                  <StudentEducation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/projects"
              element={
                <ProtectedRoute>
                  <StudentProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/skills"
              element={
                <ProtectedRoute>
                  <StudentSkills />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/certifications"
              element={
                <ProtectedRoute>
                  <StudentCertifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/templates"
              element={
                <ProtectedRoute>
                  <StudentTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/ats"
              element={
                <ProtectedRoute>
                  <StudentATS />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/download"
              element={
                <ProtectedRoute>
                  <StudentDownload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/jobs"
              element={
                <ProtectedRoute>
                  <StudentJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/applications"
              element={
                <ProtectedRoute>
                  <StudentApplications />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<div className="p-6 text-white">Page Not Found</div>} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BackendSessionProvider>
  )
}

export default App
