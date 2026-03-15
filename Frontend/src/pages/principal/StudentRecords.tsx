"use client"

import { useEffect, useState } from "react"
import { Users, Search, Mail, Phone, GraduationCap, BookOpen, Filter } from "lucide-react"
import PrincipalSidebar from "@/components/principal-sidebar"
import { principalAPI } from "@/lib/api"

interface Student {
  id: string
  name: string
  rollNo: string
  email: string
  phone: string
  department: string
  year: string
  cgpa: number
  status: "active" | "inactive"
}

export default function PrincipalStudentRecordsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await principalAPI.getStudentRecords()
        const mapped = Array.isArray(res.data)
          ? res.data.map((s: any) => ({
              id: s.id || s._id,
              name: s.name,
              rollNo: s.rollNo || "N/A",
              email: s.email,
              phone: s.phone || "N/A",
              department: s.department || "N/A",
              year: s.year ? `${s.year}th Year` : "N/A",
              cgpa: s.cgpa || 0,
              status: (s.status === "suspended" ? "inactive" : "active") as "active" | "inactive",
            }))
          : []
        setStudents(mapped)
      } catch (error) {
        console.error("Failed to load student records", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const [searchTerm, setSearchTerm] = useState("")
  const [filterDept, setFilterDept] = useState("all")

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = filterDept === "all" || student.department === filterDept
    return matchesSearch && matchesDept
  })

  const departments = ["all", ...Array.from(new Set(students.map((s) => s.department)))]

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
            <div className="flex items-center gap-3 text-white">
              <Users className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Student Records</h1>
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
                <h3 className="text-white/70 text-sm mb-2">Active</h3>
                <div className="text-3xl font-bold text-green-400">
                  {students.filter((s) => s.status === "active").length}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Departments</h3>
                <div className="text-3xl font-bold text-indigo-400">{departments.length - 1}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Avg CGPA</h3>
                <div className="text-3xl font-bold text-white">
                  {(students.reduce((sum, s) => sum + s.cgpa, 0) / students.length).toFixed(2)}
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
                  placeholder="Search by name or roll number..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-white/60" />
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept} className="bg-[#1a1d3e]">
                      {dept === "all" ? "All Departments" : dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 hover:border-indigo-500/30 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{student.name}</h3>
                      <p className="text-white/70 text-sm">{student.rollNo}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        student.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                    {student.status.toUpperCase()}
                  </span>
                </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Mail className="w-4 h-4" />
                      <span>{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Phone className="w-4 h-4" />
                      <span>{student.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <BookOpen className="w-4 h-4" />
                      <span>{student.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <GraduationCap className="w-4 h-4" />
                      <span>{student.year} • CGPA: {student.cgpa}</span>
                    </div>
                  </div>
                </div>
              ))}
              {loading && <p className="text-white/60">Loading...</p>}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
