export interface Criteria {
  minCGPA?: number
  minPercentage10?: number
  minPercentage12?: number
  allowedBranches?: string[]
  maxBacklogs?: number
  maxGapYears?: number
  minAttendancePercent?: number
  graduationYear?: number
  minAtsScore?: number
  minJobMatchScore?: number
  allowedDepartments?: string[]
  allowedBatches?: string[]
  requiredSkills?: string[]
  [key: string]: unknown
}

export interface Company {
  _id: string
  name: string
  description?: string
  criteria: Criteria
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}
