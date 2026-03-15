export type ServerRole =
  | "platform_admin"
  | "principal"
  | "placement_officer"
  | "hod"
  | "student"
  | "standalone_student"
  | "placement"
  | "admin"

export type AccountStatus = "ACTIVE" | "INVITED" | "PENDING" | "BLOCKED"

export interface InviteStudentRequest {
  email: string
  name: string
  department: string
  year: string
  batch: string
}

export interface InviteStudentResponse {
  success: boolean
  message: string
  token?: string
}

export interface AuthLoginRequest {
  email: string
  password: string
  role?: ServerRole
  totp?: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: ServerRole
}

export interface AuthLoginResponse {
  user: AuthUser
  accessToken: string
  csrfToken?: string
  expiresAt?: number
}

export interface StudentListItem {
  studentId: string
  name: string
  email: string
  department: string
  batch: string
  year: number | string
  status: string
  profileCompleted: boolean
  resumeCompletion: number
  atsScore: number
  jobMatchScore: number
  jobReady: boolean
  lastAIScoredAt: string | null
  skills: string[]
}

export interface StudentListResponse {
  count: number
  students: StudentListItem[]
}

export interface ReportOverview {
  totalStudents: number
  resumesCompletedCount: number
  averageAtsScore: number
  jobReadyCount: number
  distributionByYear: Array<{ year: string | number; count: number }>
  distributionByDepartment: Array<{ department: string; count: number }>
}
