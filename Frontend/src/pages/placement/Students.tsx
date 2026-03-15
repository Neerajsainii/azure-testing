"use client"

import { useState, useEffect } from "react"
import { Users, Search } from "lucide-react"
import PlacementSidebar from "@/components/placement-sidebar"
import { placementAPI } from "@/lib/api"

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  department: string
  year: string
  cgpa: number
  skills: string[]
  status: "placed" | "applying" | "available"
}

export default function PlacementStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await placementAPI.getStudents()
        // Map backend data to frontend interface
        const mappedStudents = Array.isArray(response.data) 
          ? response.data.map((s: any) => ({
              id: s.studentId || s._id || s.id,
              name: s.name,
              email: s.email,
              phone: s.phone || s.mobileNumber || "N/A",
              department: s.department || "N/A",
              year: s.year ? `${s.year}th Year` : "N/A",
              cgpa: s.cgpa || s.atsScore || 0, // Fallback to ATS score if CGPA not available
              skills: s.skills || [],
              status:
                s.placementStatus === "placed"
                  ? "placed"
                  : (s.jobReady ? "applying" : "available")
            }))
          : []
        setStudents(mappedStudents)
      } catch (error) {
        console.error("Failed to fetch students", error)
      }
    }

    fetchStudents()
  }, [])

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || student.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "placed":
        return "bg-green-500/20 text-green-400"
      case "applying":
        return "bg-blue-500/20 text-blue-400"
      case "available":
        return "bg-purple-500/20 text-purple-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #1e2a78 0%, #2d3a8c 25%, #1a1d3e 60%, #0f1238 100%)",
      }}
    >
      <div className="flex">
        <PlacementSidebar />

        <main className="flex-1 ml-64">
          <header className="bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-8 py-5 shadow-lg">
            <div className="flex items-center gap-3 text-white">
              <Users className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Students</h1>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Total Students</h3>
                <div className="text-3xl font-bold text-white">{students.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Placed</h3>
                <div className="text-3xl font-bold text-green-400">
                  {students.filter((s) => s.status === "placed").length}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Applying</h3>
                <div className="text-3xl font-bold text-blue-400">
                  {students.filter((s) => s.status === "applying").length}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Available</h3>
                <div className="text-3xl font-bold text-purple-400">
                  {students.filter((s) => s.status === "available").length}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all" className="bg-[#1a1d3e]">All Status</option>
                <option value="available" className="bg-[#1a1d3e]">Available</option>
                <option value="applying" className="bg-[#1a1d3e]">Applying</option>
                <option value="placed" className="bg-[#1a1d3e]">Placed</option>
              </select>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto bg-white/5 rounded-lg p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-3 text-white/80">ID</th>
                    <th className="px-4 py-3 text-white/80">Name</th>
                    <th className="px-4 py-3 text-white/80">Email</th>
                    <th className="px-4 py-3 text-white/80">Phone</th>
                    <th className="px-4 py-3 text-white/80">Department</th>
                    <th className="px-4 py-3 text-white/80">Year</th>
                    <th className="px-4 py-3 text-white/80">CGPA</th>
                    <th className="px-4 py-3 text-white/80">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-white/80">{student.id}</td>
                      <td className="px-4 py-3 text-white font-medium">{student.name}</td>
                      <td className="px-4 py-3 text-white/70">{student.email}</td>
                      <td className="px-4 py-3 text-white/70">{student.phone}</td>
                      <td className="px-4 py-3 text-white/70">{student.department}</td>
                      <td className="px-4 py-3 text-white/70">{student.year}</td>
                      <td className="px-4 py-3 text-white/70">{student.cgpa}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(student.status)}`}>
                          {student.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No students found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
