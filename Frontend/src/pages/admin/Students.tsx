import { useEffect, useMemo, useState } from "react"
import AdminSidebar from "@/components/admin-sidebar"
import { getStudents, exportStudentsZip, exportStudentsExcel, getReportSummary } from "@/lib/adminApi"
import type { StudentFilters } from "@/lib/adminApi"
import { useAuth } from "@/contexts/AuthContext"

export default function AdminStudentsPage() {
  const [filters, setFilters] = useState<StudentFilters>({})
  const [students, setStudents] = useState<any[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any | null>(null)
  const auth = useAuth()

  const load = async () => {
    setLoading(true)
    try {
      const res = await getStudents({ ...filters, q })
      setStudents(res)
      const r = await getReportSummary({ ...filters, q })
      setReport(r)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [filters, q])

  const deptOptions = useMemo(() => Array.from(new Set(students.map((s) => s.department))), [students])

  return (
    <div className="min-h-screen text-white">
      <AdminSidebar />
      <div className="min-h-screen ml-64 p-6" style={{ background: "linear-gradient(180deg,#0b1220,#1a1d3e)" }}>
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Students</h1>
          <div className="flex items-center gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name/email" className="px-3 py-2 rounded bg-[#0b1220] border border-white/10" />
            <button onClick={() => void exportStudentsZip(filters, auth.session)} className="px-3 py-2 bg-blue-600 rounded">Export ZIP</button>
            <button onClick={() => void exportStudentsExcel(filters, auth.session)} className="px-3 py-2 bg-amber-600 rounded">Export Excel</button>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white/5 p-4 rounded">
            <label className="text-sm">Department</label>
            <select className="w-full mt-2 bg-transparent" onChange={(e) => setFilters((p) => ({ ...p, department: e.target.value || undefined }))}>
              <option value="">All</option>
              {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="bg-white/5 p-4 rounded">
            <label className="text-sm">Status</label>
            <select className="w-full mt-2 bg-transparent" onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value || undefined }))}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="placed">Placed</option>
            </select>
          </div>
          <div className="bg-white/5 p-4 rounded">
            <label className="text-sm">Year</label>
            <select className="w-full mt-2 bg-transparent" onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value ? Number(e.target.value) : undefined }))}>
              <option value="">All</option>
              {[2018,2019,2020,2021,2022].map((y)=> <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white/5 rounded p-4">
          <div className="mb-4">{loading ? 'Loading...' : `${students.length} students`}</div>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Year</th><th>Status</th><th>Match</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s)=>(
                <tr key={s.id} className="border-t border-white/5">
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.department}</td>
                  <td>{s.year}</td>
                  <td>{s.status}</td>
                  <td>{s.matchScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {report && (
          <div className="mt-6 bg-white/5 p-4 rounded">
            <h3 className="font-semibold">Report Summary</h3>
            <div>Total Students: {report.totalStudents}</div>
            <div>Job Ready (&gt;70): {report.jobReadyCount}</div>
            <div>Average ATS Score: {report.avgAtsScore}</div>
          </div>
        )}
      </div>
    </div>
  )
}
