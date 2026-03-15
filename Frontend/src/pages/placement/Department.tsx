
"use client"

import { useState, useEffect } from "react"
import { Building2, Search, Users, Mail, Phone, Loader2 } from "lucide-react"
import NotificationBell from "@/components/NotificationBell"
import { placementAPI } from "@/lib/api"
import PlacementSidebar from "@/components/placement-sidebar"

interface Student {
  id: string
  name: string
  email: string
  phone: string
  department: string
  year: string
  cgpa: number
  skills: string[]
  status: string
  rollNo?: string
  atsScore?: number
  jobReady?: boolean
}

interface Department {
  id: number
  code?: string
  name: string
  hodName: string
  hrPhone?: string
  hrEmail?: string
  totalStudents: number
  eligibleStudents: number
  placedStudents: number
  avgPackage: string
  placementRate: number
}

export default function PlacementDepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Use the new dedicated endpoint
        const res = await placementAPI.getDepartments()
        // API returns: { name, totalStudents, placedStudents, avgCGPA, eligibleStudents, hodName, ... }
        // Need to map to Department interface
        const deptList: Department[] = (res.data as any[]).map((d: any, index: number) => ({
          id: index + 1,
          name: d.name,
          code: d.name.substring(0, 3).toUpperCase(),
          hodName: d.hodName || "Not Assigned",
          totalStudents: d.totalStudents || 0,
          eligibleStudents: d.eligibleStudents || 0,
          placedStudents: d.placedStudents || 0,
          avgPackage: d.avgPackage || "N/A",
          placementRate: d.placementRate || 0,
          hrEmail: d.contactEmail,
          hrPhone: d.contactPhone
        }))

        setDepartments(deptList)
      } catch (err) {
        console.error("Failed to fetch departments data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const [searchTerm, setSearchTerm] = useState("")

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [modalStudents, setModalStudents] = useState<Student[] | null>(null)
  const [loadingStudents, setLoadingStudents] = useState(false)

  const openStudentsModal = async (dept: Department) => {
    setModalOpen(true)
    setLoadingStudents(true)
    try {
      const students = await placementAPI.getStudents()
      const allStudents = (students.data as any[]).map(s => ({
        id: s.studentId || s._id || s.id,
        name: s.name,
        email: s.email,
        phone: s.phone || s.mobileNumber || "N/A",
        department: s.department || "N/A",
        year: s.year ? `${s.year}th Year` : "N/A",
        cgpa: s.cgpa || 0,
        skills: s.skills || [],
        status: s.placementStatus === "placed" ? "placed" : (s.jobReady ? "applying" : "available"),
        rollNo: s.rollNo,
        atsScore: s.atsScore,
        jobReady: s.jobReady
      })) as Student[]
      
      const deptStudents = allStudents.filter(s => 
        dept.name ? s.department === dept.name : true
      )
      setModalStudents(deptStudents)
    } catch (err) {
      console.error(err)
      setModalStudents([])
    } finally {
      setLoadingStudents(false)
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
          <header className="bg-gradient-to-r from-[#14b8a6] to-[#0d9488] px-8 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Building2 className="w-6 h-6 text-white" />
                <div>
                  <h1 className="text-2xl font-bold">Departments</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell />
              </div>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 lift-on-hover fade-in">
                <h3 className="text-white/70 text-sm mb-2">Total Departments</h3>
                <div className="text-3xl font-bold text-white">{departments.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 lift-on-hover fade-in">
                <h3 className="text-white/70 text-sm mb-2">Eligible Students</h3>
                <div className="text-3xl font-bold text-purple-400">
                  {departments.reduce((sum, d) => sum + d.eligibleStudents, 0)}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 lift-on-hover fade-in">
                <h3 className="text-white/70 text-sm mb-2">Placed Students</h3>
                <div className="text-3xl font-bold text-green-400">
                  {departments.reduce((sum, d) => sum + d.placedStudents, 0)}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 lift-on-hover fade-in">
                <h3 className="text-white/70 text-sm mb-2">Avg Placement Rate</h3>
                <div className="text-3xl font-bold text-white">
                  {departments.length > 0 ? (
                    (departments.reduce((sum, d) => sum + d.placementRate, 0) / departments.length).toFixed(1)
                  ) : "0.0"}
                  %
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search departments..."
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Departments Grid */}
            {loading ? (
              <div className="text-center text-white py-10 flex items-center justify-center gap-2">
                 <Loader2 className="animate-spin w-5 h-5" />
                 Loading departments...
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDepartments.length === 0 ? (
                <div className="col-span-2 text-center text-white/60">No departments found.</div>
              ) : filteredDepartments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 hover:border-purple-500/30 transition fade-in"
                >
                  <h3 className="text-xl font-bold text-white mb-3">{dept.name}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Users className="w-4 h-4" />
                      <span>HOD: {dept.hodName}</span>
                    </div>
                    { (dept.hrPhone || dept.hrEmail) && (
                      <div className="flex items-center gap-4 text-white/70 text-sm">
                        {dept.hrPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{dept.hrPhone}</span>
                          </div>
                        )}
                        {dept.hrEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{dept.hrEmail}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/60 text-xs mb-1">Total Students</p>
                      <p className="text-xl font-bold text-white">{dept.totalStudents}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/60 text-xs mb-1">Eligible</p>
                      <p className="text-xl font-bold text-purple-400">{dept.eligibleStudents}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/60 text-xs mb-1">Placed</p>
                      <p className="text-xl font-bold text-green-400">{dept.placedStudents}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/60 text-xs mb-1">Avg Package</p>
                      <p className="text-xl font-bold text-white">{dept.avgPackage}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70 text-sm">Placement Rate</span>
                      <span className="text-purple-400 font-bold">
                        {dept.placementRate}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all"
                        style={{ width: `${dept.placementRate}%` }}
                      />
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => openStudentsModal(dept)}
                        className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm transition"
                      >
                        View Students
                      </button>
                      <button
                        onClick={async () => {
                          // load dependencies
                          const load = (src: string) =>
                            new Promise<void>((resolve, reject) => {
                              if (document.querySelector(`script[src="${src}"]`)) return resolve()
                              const s = document.createElement("script")
                              s.src = src
                              s.onload = () => resolve()
                              s.onerror = () => reject(new Error("Failed to load " + src))
                              document.head.appendChild(s)
                            })

                          try {
                            await load("https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js")
                            await load("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")
                            const XLSX = (window as any).XLSX
                            const JSZip = (window as any).JSZip
                            if (!XLSX) throw new Error("XLSX failed to load")
                            if (!JSZip) throw new Error("JSZip failed to load")

                            // fetch students for this department
                            const studentsRes = await placementAPI.getStudents()
                            const allStudents = (studentsRes.data as any[]).map(s => ({
                              id: s.studentId || s._id || s.id,
                              name: s.name,
                              email: s.email,
                              phone: s.phone || s.mobileNumber || "N/A",
                              department: s.department || "N/A",
                              year: s.year ? `${s.year}th Year` : "N/A",
                              cgpa: s.cgpa || s.atsScore || 0,
                              skills: s.skills || [],
                              status: s.placementStatus === "placed" ? "placed" : (s.jobReady ? "applying" : "available"),
                              rollNo: s.rollNo,
                              matchScore: s.atsScore || 0,
                              atsScore: s.atsScore || 0
                            })) as any[]
                            
                            const students = allStudents.filter(s => 
                              dept.name ? s.department === dept.name : true
                            )

                            // determine eligibility: not placed and matchScore >= 50
                            const eligible = students.filter((s) => s.status !== "placed" && s.matchScore >= 50)
                            const notEligible = students.filter((s) => !(s.status !== "placed" && s.matchScore >= 50))
                            const ws3 = XLSX.utils.json_to_sheet(students.map((s: any) => ({ ID: s.id, Name: s.name, Email: s.email, AppliedCompanies: (s.matchScore > 80) ? "TCS;Infosys" : "" })))

                            const wb = XLSX.utils.book_new()
                            if (eligible.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eligible), "Eligible")
                            if (notEligible.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(notEligible), "Not Eligible")
                            XLSX.utils.book_append_sheet(wb, ws3, "All Students")

                            const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
                            const xblob = new Blob([wbout], { type: "application/octet-stream" })

                            // Zip the workbook
                            const zip = new JSZip()
                            zip.file(`${dept.code || dept.name}-department-report.xlsx`, xblob)
                            zip.file("readme.txt", `Department: ${dept.name}\nGenerated: ${new Date().toISOString()}`)
                            const zblob = await zip.generateAsync({ type: "blob" })

                            const url = URL.createObjectURL(zblob)
                            const a = document.createElement("a")
                            a.href = url
                            a.download = `${(dept.code || dept.name).replace(/\s+/g, "_")}-report.zip`
                            document.body.appendChild(a)
                            a.click()
                            a.remove()
                            URL.revokeObjectURL(url)
                          } catch (err: any) {
                            console.error(err)
                            alert("Export failed: " + (err?.message || err))
                          }
                        }}
                        className="px-3 py-2 bg-white text-purple-700 rounded-lg hover:bg-white/90 transition text-sm font-medium"
                      >
                        Export Report
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
          {/* Students Modal */}
          {modalOpen && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-2xl bg-[#07102a] border border-white/10 rounded-xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Students in Department</h3>
                  <button onClick={() => setModalOpen(false)} className="text-white/60 hover:text-white transition">Close</button>
                </div>
                <div className="max-h-72 overflow-auto custom-scrollbar">
                  {loadingStudents && <div className="text-white/60 flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4"/> Loading...</div>}
                  {!loadingStudents && modalStudents && modalStudents.length === 0 && (
                    <div className="text-white/60">No students found.</div>
                  )}
                  {!loadingStudents && modalStudents && modalStudents.length > 0 && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-white/10">
                          <th className="px-4 py-2 text-white/80">Name</th>
                          <th className="px-4 py-2 text-white/80">Roll No</th>
                          <th className="px-4 py-2 text-white/80">Year</th>
                          <th className="px-4 py-2 text-white/80">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {modalStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-white/5 transition">
                            <td className="px-4 py-2 text-white">{s.name}</td>
                            <td className="px-4 py-2 text-white/70">{s.rollNo || `R-${s.id.substring(0,6)}`}</td>
                            <td className="px-4 py-2 text-white/70">{s.year}</td>
                            <td className="px-4 py-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${s.status === 'placed' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'}`}>
                                    {s.status}
                                </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
