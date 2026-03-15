export type ResumeStatus = "Completed" | "Pending"

export interface StudentDashboardResponse {
  resumeStatus: ResumeStatus
  resumeCompletion: number
  atsScore: number
  lastUpdated: string | null
}

export interface HodStudent {
  name: string
  year: number
  cgpa: number
}

export interface Activity {
  id: string
  student: string
  action: string
  department: string
  timestamp: string
  status: string
}

export interface HodDashboardResponse {
  department: string
  totalStudents: number
  students: HodStudent[]
  recentActivities: Activity[]
}

export interface PlacementStudent {
  name: string
  department: string
  batch: string | number
  cgpa: number
}

export interface PlacementDashboardResponse {
  totalStudents: number
  students: PlacementStudent[]
  activeJobsCount?: number
}interface PrincipalDepartmentStat {
  _id: string
  totalStudents: number
  avgCGPA: number
}

export interface PrincipalDashboardResponse {
  departments: PrincipalDepartmentStat[]
  departmentsCount: number
}

export interface ReportOverviewResponse {
  totalStudents: number
  resumesCompletedCount: number
  averageAtsScore: number
  jobReadyCount: number
  distributionByYear: { year: string | number; count: number }[]
  distributionByDepartment: { department: string; count: number }[]
  totalOffers?: number
  highestPackage?: string
  averagePackage?: string
  placementPercentage?: number
}
