/**
 * API Client for STON Technology React Frontend
 * Handles all backend communication with JWT authentication
 */

import axios, { type AxiosInstance, type AxiosError } from "axios"
import type { Company } from "@/types/company"
import type { ReportOverviewResponse } from "@/types/dashboard"
import { getAuthToken } from "@/lib/authToken"
import { clearCsrfToken, getCsrfToken } from "@/lib/csrfToken"
import { APP_ENV } from "@/config/env"
import { resolveLoginPath } from "@/lib/loginFlow"

const API_BASE_URL = APP_ENV.apiBaseUrl

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request Interceptor - Add JWT (if available)
apiClient.interceptors.request.use(async (config: any) => {
  const token = await getAuthToken()
  const method = String(config.method || "get").toLowerCase()

  if (!config.headers) config.headers = {}
  if (token) config.headers.Authorization = `Bearer ${token}`

  if (token && !["get", "head", "options"].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken
    }
  }
  return config
})

// Response Interceptor - Handle 401 errors
apiClient.interceptors.response.use(
  (response: any) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearCsrfToken()
      const pathname = window.location.pathname
      // Never redirect on 401 when on login pages or auth callback to avoid loops
      // and to let the callback page show session errors (e.g. token not ready).
      const noRedirectPaths = ["/login", "/administration-login", "/administration", "/main", "/auth/callback"]
      const willRedirect = !noRedirectPaths.includes(pathname)
      if (willRedirect) {
        const loginPath = resolveLoginPath(pathname)
        window.location.href = loginPath
      }
    } else if (error.response?.status === 403) {
      const data = error.response.data as { code?: string } | undefined
      if (data?.code === "CSRF_INVALID") {
        clearCsrfToken()
      }
    } else if (error.response?.status === 429) {
      // Handle Rate Limiting (Download Limit)
      const data = error.response.data as { message?: string } | undefined
      alert(data?.message || "Monthly download limit exceeded. Please contact admin.")
    }
    return Promise.reject(error)
  }
)

export const commonAPI = {
  getNotifications: () => apiClient.get("/api/notifications"),
  markNotificationRead: (id: string) => apiClient.put(`/api/notifications/${id}/read`),
  deleteNotification: (id: string) => apiClient.delete(`/api/notifications/${id}`),
  markAllNotificationsRead: () => apiClient.put("/api/notifications/read-all"),
}

export const contactAPI = {
  submitQuery: (data: { name: string; email: string; college?: string; message: string }) =>
    apiClient.post("/api/contact", data),
}

// Auth endpoints
export const authAPI = {
  loginWithIntent: (payload: {
    email: string
    password: string
    loginIntent: "student" | "administration" | "main"
    selectedRole?: "principal" | "hod" | "placement_officer"
  }) => apiClient.post("/api/auth/login", payload),

  register: (data: {
    email: string
    password: string
    name: string
    role: string
    collegeName?: string
    mobileNumber?: string
    department?: string
    year?: number
    batch?: string
    token?: string
  }) => apiClient.post("/api/auth/signup", data),

  activateInvite: (data: { email: string; newPassword?: string; token: string }) =>
    apiClient.post("/api/auth/invite/activate", data),

  oauthCallback: (_provider: string, _code: string) => Promise.reject(new Error("OAuth is disabled")),

  logout: () => apiClient.post("/api/auth/logout"),

  getSession: () => apiClient.get("/api/auth/session"),

  refreshToken: () => Promise.reject(new Error("Refresh token endpoint is not implemented")),
}

// Placement endpoints
export const placementAPI = {
  getProfile: () => apiClient.get("/api/placement/profile"),
  updateProfile: (data: any) => apiClient.put("/api/placement/profile", data),
  getDashboard: (params?: {
    department?: string;
    batch?: string;
    minCGPA?: number;
    year?: number;
    sortBy?: string;
    order?: "asc" | "desc"
  }) => apiClient.get("/api/dashboard/placement", { params }),
  getCompanies: () => apiClient.get("/api/companies"),
  getStudents: () =>
    apiClient.get("/api/admin/students").then((res: any) => ({
      ...res,
      data: Array.isArray(res.data) ? res.data : (res.data?.students || []),
    })),
  getDepartments: () => apiClient.get("/api/placement/departments"),
  getOpenings: () =>
    apiClient.get("/api/placement/openings").then((res: any) => ({
      ...res,
      data: Array.isArray(res.data) ? res.data : (res.data?.drives || []),
    })),
  createOpening: (data: any) =>
    apiClient.post("/api/placement/openings", data).then((res: any) => ({
      ...res,
      data: (() => {
        const d = res.data?.drive || res.data
        return {
          ...d,
          company: d.company || data.company || "",
          postedDate: d.postedDate || d.createdAt || new Date().toISOString(),
          status: d.status === "closed" ? "closed" : "open",
        }
      })(),
    })),
  listDrives: (params?: Record<string, any>) => apiClient.get("/api/placement/drives", { params }),
  getDrive: (id: string) => apiClient.get(`/api/placement/drives/${id}`),
  createDrive: (data: any) => apiClient.post("/api/placement/drives", data),
  updateDrive: (id: string, data: any) => apiClient.put(`/api/placement/drives/${id}`, data),
  updateDriveStatus: (id: string, status: string) => apiClient.patch(`/api/placement/drives/${id}/status`, { status }),
  deleteDrive: (id: string) => apiClient.delete(`/api/placement/drives/${id}`),
  recomputeEligibility: (id: string) => apiClient.post(`/api/placement/drives/${id}/eligibility/recompute`),
  getDriveCandidates: (id: string, params?: Record<string, any>) =>
    apiClient.get(`/api/placement/drives/${id}/candidates`, { params }),
  updateCandidateRoundStatus: (id: string, studentId: string, data: any) =>
    apiClient.patch(`/api/placement/drives/${id}/candidates/${studentId}/round-status`, data),
  updateCandidateFinalStatus: (id: string, studentId: string, data: any) =>
    apiClient.patch(`/api/placement/drives/${id}/candidates/${studentId}/final-status`, data),
  updateCandidateOffer: (id: string, studentId: string, data: any) =>
    apiClient.patch(`/api/placement/drives/${id}/candidates/${studentId}/offer`, data),
  getStats: () => apiClient.get("/api/placement/stats"),
  sendNotification: (data: any) => apiClient.post("/api/notifications", data),
  exportReport: (format: "csv" | "xlsx" | "pdf" = "csv") =>
    apiClient.get("/api/placement/report/export", { params: { format }, responseType: "blob" }),
  getReportOverview: () => apiClient.get<ReportOverviewResponse>("/api/placement/report/overview"),
  matchCandidates: (jobDescription: string) => apiClient.post("/api/placement/match-candidates", { jobDescription }),
}

// Companies endpoints
export const companiesAPI = {
  list: () => apiClient.get<Company[]>("/api/companies"),
  getById: (id: string) => apiClient.get<Company>(`/api/companies/${id}`),
  create: (data: Pick<Company, "name" | "criteria" | "description">) =>
    apiClient.post<Company>("/api/companies", data),
  remove: (id: string) => apiClient.delete(`/api/companies/${id}`),
  runShortlist: (id: string) => apiClient.post(`/api/companies/${id}/shortlist`),
  getShortlist: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/api/companies/${id}/shortlist`, { params }),
}

// Student endpoints moved below to include dashboard method

// Admin endpoints
export const adminAPI = {
  getDashboard: () => apiClient.get("/api/admin/dashboard"),
  getColleges: () => apiClient.get("/api/admin/colleges"),
  createCollege: (data: { name: string; departmentLimit?: number | null; studentLimit?: number | null; status?: "active" | "inactive" }) =>
    apiClient.post("/api/admin/colleges", data),
  updateCollege: (
    id: string,
    data: { name?: string; departmentLimit?: number | null; studentLimit?: number | null; status?: "active" | "inactive" }
  ) => apiClient.put(`/api/admin/colleges/${id}`, data),
  deleteCollege: (id: string) => apiClient.delete(`/api/admin/colleges/${id}`),
  getPrincipals: () => apiClient.get("/api/admin/principals"),
  getUsers: (params?: any) => apiClient.get("/api/admin/users", { params }),
  createUser: (data: any) => apiClient.post("/api/admin/users", data),
  updateUser: (id: string, data: any) => apiClient.put(`/api/admin/users/${id}`, data),
  deleteUser: (id: string) => apiClient.delete(`/api/admin/users/${id}`),
  getAuditLogs: () => apiClient.get("/api/admin/audit-logs"),
  getReportOverview: () => apiClient.get("/api/admin/report/overview"),
  getPlatformOverview: () => apiClient.get("/api/platform/overview"),
  getPlatformColleges: () => apiClient.get("/api/platform/colleges"),
  updatePlatformCollegeDepartmentLimit: (collegeId: string, departmentLimit: number) =>
    apiClient.patch(`/api/platform/colleges/${collegeId}/department-limit`, { departmentLimit }),
  getProfile: () => apiClient.get("/api/admin/profile"),
  updateProfile: (data: any) => apiClient.put("/api/admin/profile", data),
  getSettings: () => apiClient.get("/api/admin/settings"),
  updateSettings: (data: any) => apiClient.put("/api/admin/settings", data),
  getDepartments: () => apiClient.get("/api/admin/departments"),
  getContactQueries: () => apiClient.get("/api/admin/contacts"),
}

// Principal endpoints
export const principalAPI = {
  getProfile: () => apiClient.get("/api/principal/profile"),
  updateProfile: (data: any) => apiClient.put("/api/principal/profile", data),
  getDashboard: () => apiClient.get("/api/dashboard/principal"),
  getDepartments: () => apiClient.get("/api/principal/departments"),
  createDepartment: (data: { name: string; hodName?: string }) => apiClient.post("/api/principal/departments", data),
  createHod: (data: { email: string; departmentId: string }) =>
    apiClient.post("/api/principal/create-hod", data),
  createPlacementOfficer: (data: { email: string }) =>
    apiClient.post("/api/principal/create-placement", data),
  getGrantedAccess: () => apiClient.get("/api/principal/granted-access"),
  getPrincipalDataGraph: (depth: number = 2) =>
    apiClient.get("/api/principal/data-graph", { params: { depth } }),
  getStudentRecords: () =>
    apiClient.get("/api/principal/student-records"),
  getStudentResumeStatus: () =>
    apiClient.get("/api/principal/resume-status"),
  getPlacementOverview: () =>
    apiClient.get("/api/principal/placement-overview"),
  getReportOverview: () => apiClient.get<ReportOverviewResponse>("/api/principal/reports/overview"),
  getDepartmentPerformance: () => apiClient.get("/api/principal/analytics/department-performance"),
  getAnalyticsPlacementOverview: () => apiClient.get("/api/principal/analytics/placement-overview"),
  getBatchWiseAnalytics: () => apiClient.get("/api/principal/analytics/batch-wise"),
  getComparisonAnalytics: () => apiClient.get("/api/principal/analytics/comparison"),
  approveReport: (reportId: string, notes?: string) =>
    apiClient.post(`/api/principal/reports/${reportId}/approve`, { notes }),
  exportReport: (format: "csv" | "xlsx" | "pdf" = "csv") =>
    apiClient.get("/api/principal/reports/export", { params: { format }, responseType: "blob" }),
  getAuditLogs: () => apiClient.get("/api/principal/audit-logs"),
}

export const hodAPI = {
  inviteStudent: (data: {
    email: string
    name: string
    department?: string
    year: number
    batch?: string
    rollNo?: string
  }) => apiClient.post("/api/hod/invite-student", data),
  bulkImportStudents: (data: {
    fileName: string
    fileMimeType: string
    fileBase64: string
  }) => apiClient.post("/api/hod/import-students", data),
  listInvites: (params?: { status?: string }) => apiClient.get("/api/hod/invites", { params }),
  revokeInvite: (id: string) => apiClient.patch(`/api/hod/invites/${id}/revoke`),
  resendInvite: (id: string) => apiClient.post(`/api/hod/invites/${id}/resend`),
  getDashboard: (params?: {
    year?: number;
    sortBy?: string;
    order?: "asc" | "desc"
  }) => apiClient.get("/api/dashboard/hod", { params }),
  listStudents: (params?: Record<string, any>) =>
    apiClient.get("/api/dashboard/hod/students", { params: { ...params, _t: Date.now() } }),
  getPlacementStats: () => apiClient.get("/api/dashboard/hod/placement-stats", { params: { _t: Date.now() } }),
  getApprovals: () => apiClient.get("/api/dashboard/hod/approvals"),
  updateApproval: (id: string, status: "approved" | "rejected") =>
    apiClient.put(`/api/dashboard/hod/approvals/${id}`, { status }),
  getProfile: () => apiClient.get("/api/dashboard/hod/profile"),
  updateProfile: (data: any) => apiClient.put("/api/dashboard/hod/profile", data),
  exportStudentsZip: (params?: Record<string, any>) =>
    apiClient.get("/api/students/export/zip", { params, responseType: "blob" }),
  getReportOverview: () => apiClient.get<ReportOverviewResponse>("/api/hod/report/department"),
  exportReport: (format: "csv" | "xlsx" | "pdf" = "csv") =>
    apiClient.get("/api/hod/report/export", { params: { format }, responseType: "blob" }),
}

export const studentAPI = {
  getProfile: () => apiClient.get("/api/student/profile"),
  updateProfile: (data: any) =>
    apiClient.put("/api/student/profile", data),
  getResumes: () => apiClient.get("/api/student/resumes"),
  createResume: (data: any) =>
    apiClient.post("/api/student/resumes", data),
  getApplications: () =>
    apiClient.get("/api/student/applications"),
  getDashboard: () => apiClient.get("/api/dashboard/student"),
  getOpenings: () => apiClient.get("/api/student/openings"),
  applyToDrive: (driveId: string) => apiClient.post(`/api/student/drives/${driveId}/apply`),

  // Resume Controller Endpoints
  saveResume: (data: any) => apiClient.post("/api/resume/save", data),
  getMyResume: () => apiClient.get("/api/resume/me"),
  selectTemplate: (template: string) => apiClient.post("/api/resume/select-template", { template }),
  previewResume: () => apiClient.get("/api/resume/preview"),
  calculateATSScore: () => apiClient.post("/api/resume/ats-score"),
  getATSScore: () => apiClient.get("/api/resume/ats-score"),
  downloadResume: () => apiClient.get("/api/resume/download", { responseType: "blob" }),

  // AI Module Endpoints (Matching backend verification)
  extractSkills: (jobDescription: string) =>
    apiClient.post("/api/resume/extract-skills", { jobDescription }),

  checkJobMatch: (jobDescription: string) =>
    apiClient.post("/api/resume/job-match", { jobDescription }),

  evaluateProject: (data: { projectTitle: string; projectDescription: string; jobDescription?: string }) =>
    apiClient.post("/api/resume/evaluate-project", data),
}
export default apiClient
