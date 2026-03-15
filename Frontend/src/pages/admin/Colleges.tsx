"use client"

import { useState, useEffect } from "react"
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  MapPin,
  Users,
} from "lucide-react"
import AdminSidebar from "@/components/admin-sidebar"
import { adminAPI } from "@/lib/api"

interface College {
  _id: string
  name: string
  location?: string
  principalName?: string
  studentCount?: number
  studentLimit?: number | null
  remainingStudentSlots?: number | null
  departmentCount?: number
  departmentLimit?: number | null
  remainingDepartmentSlots?: number | null
  status?: "active" | "inactive"
}

export default function AdminCollegesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<Omit<College, "_id">>({
    name: "",
    location: "",
    principalName: "",
    studentCount: 0,
    studentLimit: null,
    remainingStudentSlots: null,
    departmentCount: 0,
    departmentLimit: null,
    remainingDepartmentSlots: null,
    status: "active",
  })

  const [colleges, setColleges] = useState<College[]>([])

  useEffect(() => {
    fetchColleges()
  }, [])

  const fetchColleges = async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getColleges()
      const mappedColleges = res.data.map((c: any) => ({
        _id: c._id,
        name: c.name,
        location: c.location || "Not Specified",
        principalName: c.principalName || "Unassigned",
        studentCount: c.studentCount || 0,
        studentLimit: c.studentLimit ?? null,
        remainingStudentSlots: c.remainingStudentSlots ?? null,
        departmentCount: c.departmentCount || 0,
        departmentLimit: c.departmentLimit ?? null,
        remainingDepartmentSlots: c.remainingDepartmentSlots ?? null,
        status: c.status || "active",
      }))
      setColleges(mappedColleges)
    } catch (error) {
      console.error("Failed to fetch colleges:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCollege = () => {
    setEditingCollegeId(null)
    setFormData({
      name: "",
      location: "",
      principalName: "",
      studentCount: 0,
      studentLimit: null,
      remainingStudentSlots: null,
      departmentCount: 0,
      departmentLimit: null,
      remainingDepartmentSlots: null,
      status: "active",
    })
    setIsModalOpen(true)
  }

  const handleEditCollege = (college: College) => {
    setEditingCollegeId(college._id)
    setFormData({
      name: college.name,
      location: college.location || "",
      principalName: college.principalName || "",
      studentCount: college.studentCount || 0,
      studentLimit: college.studentLimit ?? null,
      remainingStudentSlots: college.remainingStudentSlots ?? null,
      departmentCount: college.departmentCount || 0,
      departmentLimit: college.departmentLimit ?? null,
      remainingDepartmentSlots: college.remainingDepartmentSlots ?? null,
      status: college.status || "active",
    })
    setIsModalOpen(true)
  }

  const handleDeleteCollege = async (id: string, name: string) => {
    const confirmed = confirm(
      `⚠️ PERMANENT DELETE\n\nAre you sure you want to delete "${name}"?\n\nThis will permanently remove:\n• The college and all its departments\n• All students, HODs, Principals, and Placement Officers\n• All resumes, invitations, placement drives, and related data\n\nThis action CANNOT be undone.`
    )
    if (!confirmed) return
    try {
      await adminAPI.deleteCollege(id)
      setColleges(colleges.filter((c) => c._id !== id))
      alert(`College "${name}" and all its data have been permanently deleted.`)
    } catch (error: any) {
      console.error("Failed to delete college:", error)
      alert(error?.response?.data?.message || "Failed to delete college")
    }
  }

  const handleSaveCollege = async () => {
    if (!formData.name.trim()) {
      alert("College name is required.")
      return
    }

    try {
      // Send 0 to backend for "unlimited" (backend normalizes 0 -> null)
      const departmentLimitPayload =
        !formData.departmentLimit || formData.departmentLimit <= 0
          ? 0
          : formData.departmentLimit

      const studentLimitPayload =
        !formData.studentLimit || formData.studentLimit <= 0
          ? 0
          : formData.studentLimit

      if (editingCollegeId) {
        const res = await adminAPI.updateCollege(editingCollegeId, {
          name: formData.name,
          departmentLimit: departmentLimitPayload,
          studentLimit: studentLimitPayload,
          status: formData.status,
        })
        const updated = res.data || {}
        setColleges(
          colleges.map((college) =>
            college._id === editingCollegeId
              ? {
                ...college,
                ...formData,
                departmentLimit: updated.departmentLimit ?? formData.departmentLimit ?? null,
                departmentCount: updated.departmentCount ?? college.departmentCount ?? 0,
                remainingDepartmentSlots: updated.remainingDepartmentSlots ?? college.remainingDepartmentSlots ?? null,
                studentLimit: updated.studentLimit ?? formData.studentLimit ?? null,
                studentCount: updated.studentCount ?? college.studentCount ?? 0,
                remainingStudentSlots: updated.remainingStudentSlots ?? college.remainingStudentSlots ?? null,
                status: (updated.status || formData.status || "active") as "active" | "inactive",
              }
              : college
          )
        )
        alert("College updated successfully!")
      } else {
        const res = await adminAPI.createCollege({
          name: formData.name,
          departmentLimit: departmentLimitPayload,
          studentLimit: studentLimitPayload,
          status: formData.status,
        })
        const newCollege: College = {
          _id: res.data._id,
          name: res.data.name,
          location: formData.location || "Not Specified",
          principalName: formData.principalName || "Unassigned",
          studentCount: res.data.studentCount || 0,
          studentLimit: res.data.studentLimit ?? formData.studentLimit ?? null,
          remainingStudentSlots: res.data.remainingStudentSlots ?? null,
          departmentCount: res.data.departmentCount || 0,
          departmentLimit: res.data.departmentLimit ?? formData.departmentLimit ?? null,
          remainingDepartmentSlots: res.data.remainingDepartmentSlots ?? null,
          status: (res.data.status || formData.status || "active") as "active" | "inactive",
        }
        setColleges([newCollege, ...colleges])
        alert("College created successfully!")
      }
      setIsModalOpen(false)
      setEditingCollegeId(null)
    } catch (error: any) {
      console.error("Failed to save college:", error)
      alert(error?.response?.data?.message || "Failed to save college")
    }
  }

  const filteredColleges = colleges.filter(
    (college) =>
      college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (college.location || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #1e2a78 0%, #2d3a8c 25%, #1a1d3e 60%, #0f1238 100%)",
      }}
    >
      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 ml-64">
          <header className="bg-gradient-to-r from-[#4c54d2] to-[#5b63d3] px-8 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Building2 className="w-7 h-7" />
                <h1 className="text-2xl font-bold">College Management</h1>
              </div>
              <button
                onClick={handleAddCollege}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 transition flex items-center gap-2 font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add College
              </button>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search colleges by name or location..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Colleges Grid */}
            {loading ? (
              <div className="text-center py-12 text-white/70">Loading colleges...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredColleges.map((college) => (
                  <div
                    key={college._id}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 hover:border-white/20 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{college.name}</h3>
                        <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                          <MapPin className="w-4 h-4" />
                          <span>{college.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                          <Users className="w-4 h-4" />
                          <span>
                            Students: {college.studentCount || 0}
                            {" / "}
                            {college.studentLimit === null || college.studentLimit === undefined
                              ? "Unlimited"
                              : college.studentLimit}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                          <Building2 className="w-4 h-4" />
                          <span>
                            Departments: {college.departmentCount || 0}
                            {" / "}
                            {college.departmentLimit === null || college.departmentLimit === undefined
                              ? "Unlimited"
                              : college.departmentLimit}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm mt-2">Principal: {college.principalName}</p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${college.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                          }`}
                      >
                        {college.status?.toUpperCase()}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={() => handleEditCollege(college)}
                        className="flex-1 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition flex items-center justify-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCollege(college._id, college.name)}
                        className="flex-1 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredColleges.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No colleges found</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#15193c] w-full max-w-lg rounded-xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {editingCollegeId ? "Edit College" : "Add College"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">College Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter college name"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Location</label>
                <input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-500"
                  placeholder="City, State"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Principal Name</label>
                <input
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Principal name"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Department Limit <span className="text-white/40">(leave empty for Unlimited)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    formData.departmentLimit === null || formData.departmentLimit === 0
                      ? ""
                      : String(formData.departmentLimit)
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "")
                    if (raw === "" || raw === "0") {
                      setFormData({ ...formData, departmentLimit: null })
                    } else {
                      setFormData({ ...formData, departmentLimit: parseInt(raw, 10) })
                    }
                  }}
                  placeholder="Leave empty for Unlimited"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Student Limit <span className="text-white/40">(leave empty for Unlimited)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    formData.studentLimit === null || formData.studentLimit === 0
                      ? ""
                      : String(formData.studentLimit)
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "")
                    if (raw === "" || raw === "0") {
                      setFormData({ ...formData, studentLimit: null })
                    } else {
                      setFormData({ ...formData, studentLimit: parseInt(raw, 10) })
                    }
                  }}
                  placeholder="Leave empty for Unlimited"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as College["status"] })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="active" className="bg-[#1a1d3e]">Active</option>
                  <option value="inactive" className="bg-[#1a1d3e]">Inactive</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCollege}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
