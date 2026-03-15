"use client"

import { useState, useEffect } from "react"
import { Building2, Search, Users, TrendingUp, GraduationCap, Plus } from "lucide-react"
import PrincipalSidebar from "@/components/principal-sidebar"
import { principalAPI } from "@/lib/api"

interface DepartmentStatus {
  id: string
  name: string
  hodName: string
  totalStudents: number
  finalYearStudents: number
  placedStudents: number
  avgCGPA: number
  activeOpenings: number
  departmentLimit?: number | null
  departmentCount?: number
  remainingDepartmentSlots?: number | null
}

export default function PrincipalDepartmentStatusPage() {
  const [departments, setDepartments] = useState<DepartmentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Create State
  const [showCreate, setShowCreate] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newHod, setNewHod] = useState("")
  const [createError, setCreateError] = useState("")

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    setLoading(true)
    try {
      const res = await principalAPI.getDepartments()
      // Map backend response if needed, assuming it matches interface or is close
      setDepartments(
        Array.isArray(res.data)
          ? res.data.map((d: any) => ({
              id: d.id || d._id,
              name: d.name,
              hodName: d.hodName || "",
              totalStudents: d.totalStudents || 0,
              finalYearStudents: d.finalYearStudents || 0,
              placedStudents: d.placedStudents || 0,
              avgCGPA: d.avgCGPA || 0,
              activeOpenings: d.activeOpenings || 0,
              departmentLimit: d.departmentLimit ?? null,
              departmentCount: d.departmentCount ?? 0,
              remainingDepartmentSlots: d.remainingDepartmentSlots ?? null,
            }))
          : []
      )
    } catch (e) {
      console.error("Failed to load departments", e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setCreateError("")
    if (!newName) return
    try {
      await principalAPI.createDepartment({ name: newName, hodName: newHod })
      setShowCreate(false)
      setNewName("")
      setNewHod("")
      loadDepartments()
    } catch (e: any) {
      console.error("Failed to create department", e)
      setCreateError(e?.response?.data?.message || "Failed to create department")
    }
  }

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const capacityFromResponse = departments[0]
  const departmentLimit = capacityFromResponse?.departmentLimit ?? null
  const departmentCount = capacityFromResponse?.departmentCount ?? departments.length
  const remainingSlots = capacityFromResponse?.remainingDepartmentSlots ?? null
  const isDepartmentCapacityReached = departmentLimit !== null && departmentCount >= departmentLimit

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #1e2a78 0%, #2d3a8c 25%, #1a1d3e 60%, #0f1238 100%)",
      }}
    >
      <div className="flex">
        <PrincipalSidebar />

        <main className="flex-1 ml-64">
          <header className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-8 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Building2 className="w-7 h-7" />
                <h1 className="text-2xl font-bold">Department Management</h1>
              </div>
              <button
                onClick={() => {
                  if (isDepartmentCapacityReached) setShowLimitModal(true)
                  else setShowCreate(true)
                }}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-white/90 transition flex items-center gap-2 font-semibold disabled:opacity-50"
                disabled={isDepartmentCapacityReached}
              >
                <Plus className="w-4 h-4" />
                Add Department
              </button>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Total Departments</h3>
                <div className="text-3xl font-bold text-white">{departmentCount}</div>
                <div className="text-white/60 text-xs mt-1">
                  Limit: {departmentLimit === null ? "Unlimited" : departmentLimit}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Total Students</h3>
                <div className="text-3xl font-bold text-indigo-400">
                  {departments.reduce((sum, d) => sum + (d.totalStudents || 0), 0)}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Overall Placement</h3>
                <div className="text-3xl font-bold text-green-400">
                  {(() => {
                    const totalPlaced = departments.reduce((sum, d) => sum + (d.placedStudents || 0), 0)
                    const totalFinal = departments.reduce((sum, d) => sum + (d.finalYearStudents || 0), 0)
                    return totalFinal > 0 ? ((totalPlaced / totalFinal) * 100).toFixed(1) : 0
                  })()}
                  %
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Remaining Department Slots</h3>
                <div className="text-3xl font-bold text-white">
                  {remainingSlots === null ? "∞" : remainingSlots}
                </div>
              </div>
            </div>

            {isDepartmentCapacityReached && (
              <div className="mb-4 px-4 py-3 rounded-lg border border-yellow-500/40 bg-yellow-500/15 text-yellow-200">
                Department limit reached for this college.
              </div>
            )}

            {/* Search */}
            <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search departments..."
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Department Cards */}
            {loading ? (
                <div className="text-white text-center py-12">Loading departments...</div>
            ) : filteredDepartments.length > 0 ? (
            <div className="space-y-6">
              {filteredDepartments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 hover:border-indigo-500/30 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">{dept.name}</h3>
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <Users className="w-4 h-4" />
                        <span>HOD: {dept.hodName || "Not Assigned"}</span>
                      </div>
                    </div>
                    <div className="bg-indigo-500/20 px-4 py-2 rounded-lg">
                      <p className="text-white/60 text-xs">Avg CGPA</p>
                      <p className="text-2xl font-bold text-indigo-400">{dept.avgCGPA || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 mb-4">
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <GraduationCap className="w-5 h-5 text-white/60 mx-auto mb-2" />
                      <p className="text-white/60 text-xs mb-1">Total Students</p>
                      <p className="text-xl font-bold text-white">{dept.totalStudents || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <Users className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                      <p className="text-white/60 text-xs mb-1">Final Year</p>
                      <p className="text-xl font-bold text-blue-400">{dept.finalYearStudents || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
                      <p className="text-white/60 text-xs mb-1">Placed</p>
                      <p className="text-xl font-bold text-green-400">{dept.placedStudents || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <TrendingUp className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                      <p className="text-white/60 text-xs mb-1">Remaining</p>
                      <p className="text-xl font-bold text-yellow-400">
                        {(dept.finalYearStudents || 0) - (dept.placedStudents || 0)}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <Building2 className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                      <p className="text-white/60 text-xs mb-1">Openings</p>
                      <p className="text-xl font-bold text-purple-400">{dept.activeOpenings || 0}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70 text-sm">Placement Progress</span>
                      <span className="text-green-400 font-bold">
                        {dept.finalYearStudents > 0 ? ((dept.placedStudents / dept.finalYearStudents) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all"
                        style={{
                          width: `${dept.finalYearStudents > 0 ? (dept.placedStudents / dept.finalYearStudents) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            ) : (
                <div className="text-center py-12">
                    <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60 text-lg">No departments found.</p>
                </div>
            )}
          </div>
        </main>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f1238] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-white text-xl font-bold mb-4">Add Department</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Department Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">HOD Name (Optional)</label>
                <input
                  value={newHod}
                  onChange={(e) => setNewHod(e.target.value)}
                  placeholder="e.g. Dr. Smith"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || isDepartmentCapacityReached}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
            {createError && (
              <div className="mt-3 px-3 py-2 rounded bg-red-500/20 border border-red-500/40 text-sm text-red-200">
                {createError}
              </div>
            )}
          </div>
        </div>
      )}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f1238] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-white text-xl font-bold mb-2">Department Limit Reached</h2>
            <p className="text-white/80 text-sm mb-4">Contact admin to increase the college department limit.</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLimitModal(false)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
