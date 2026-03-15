"use client"

import { useState, useEffect } from "react"
import { FileText, Plus, Search, Pencil, Trash2, Users } from "lucide-react"
import PlacementSidebar from "@/components/placement-sidebar"
import { placementAPI } from "@/lib/api"

interface JobOpening {
  id: string
  title: string
  company: string
  location: string
  salary: string
  type: "Full-time" | "Internship" | "Contract"
  experience: string
  postedDate: string
  applicants: number
  status: "open" | "closed"
}

export default function PlacementOpeningsPage() {
  const [openings, setOpenings] = useState<JobOpening[]>([])

  useEffect(() => {
    const fetchOpenings = async () => {
      try {
        const response = await placementAPI.getOpenings()
        // Map backend data to frontend interface
        const mappedOpenings = Array.isArray(response.data)
          ? response.data.map((o: any) => ({
            id: o._id || o.id,
            title: o.title,
            company: o.company,
            location: o.location || "Remote",
            salary: o.salary || "Not Disclosed",
            type: o.type || "Full-time",
            experience: o.experience || "Fresher",
            postedDate: o.postedDate ? new Date(o.postedDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            applicants: o.applicants || 0,
            status: o.status || "open"
          }))
          : []
        setOpenings(mappedOpenings)
      } catch (error) {
        console.error("Failed to fetch openings", error)
      }
    }
    fetchOpenings()
  }, [])

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newOpening, setNewOpening] = useState<Partial<JobOpening>>({
    title: "",
    company: "",
    location: "",
    salary: "",
    type: "Full-time",
    experience: "",
    postedDate: new Date().toISOString().slice(0, 10),
    applicants: 0,
    status: "open",
  })

  const handleEdit = (opening: JobOpening) => {
    setEditingId(opening.id)
    setNewOpening(opening)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this opening?")) return
    try {
      await placementAPI.deleteDrive(id)
      setOpenings((prev) => prev.filter((o) => o.id !== id))
    } catch (error) {
      console.error("Failed to delete opening", error)
      alert("Failed to delete opening. Please try again.")
    }
  }

  const filteredOpenings = openings.filter((opening) => {
    const matchesSearch =
      opening.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opening.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || opening.status === filterStatus
    return matchesSearch && matchesStatus
  })

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <FileText className="w-7 h-7" />
                <h1 className="text-2xl font-bold">Job Openings</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
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
                      await load("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")
                      const JSZip = (window as any).JSZip
                      if (!JSZip) throw new Error("JSZip failed to load")

                      // build CSV from openings
                      const headers = ["ID", "Title", "Company", "Location", "Salary", "Type", "Experience", "PostedDate", "Applicants", "Status"]
                      const rows = [headers.join(",")]
                      for (const o of openings) {
                        const r = [
                          o.id,
                          o.title,
                          o.company,
                          o.location,
                          o.salary,
                          o.type,
                          o.experience,
                          o.postedDate,
                          String(o.applicants),
                          o.status,
                        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
                        rows.push(r)
                      }

                      const zip = new JSZip()
                      zip.file("job_openings.csv", rows.join("\n"))
                      zip.file("readme.txt", `Generated: ${new Date().toISOString()}\nCount: ${openings.length}`)
                      const blob = await zip.generateAsync({ type: "blob" })

                      const a = document.createElement("a")
                      const url = URL.createObjectURL(blob)
                      a.href = url
                      a.download = `job-openings-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.zip`
                      document.body.appendChild(a)
                      a.click()
                      a.remove()
                      URL.revokeObjectURL(url)
                    } catch (err: any) {
                      console.error(err)
                      alert("Export failed: " + (err?.message || err))
                    }
                  }}
                  className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-white/90 transition flex items-center gap-2 font-semibold"
                >
                  Export Openings
                </button>

                <button onClick={() => { setEditingId(null); setNewOpening({ title: "", company: "", location: "", salary: "", type: "Full-time", experience: "", postedDate: new Date().toISOString().slice(0, 10), applicants: 0, status: "open" }); setShowModal(true) }} className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-white/90 transition flex items-center gap-2 font-semibold">
                  <Plus className="w-4 h-4" />
                  Post Opening
                </button>
              </div>
            </div>
          </header>

          {/* New Opening Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
              <div className="relative bg-white rounded-xl w-full max-w-2xl p-6">
                <h3 className="text-lg font-bold mb-4">{editingId ? "Edit Job Opening" : "Post Job Opening"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={newOpening.title} onChange={(e) => setNewOpening((s) => ({ ...s, title: e.target.value }))} placeholder="Title" className="p-2 border rounded" />
                  <input value={newOpening.company} onChange={(e) => setNewOpening((s) => ({ ...s, company: e.target.value }))} placeholder="Company" className="p-2 border rounded" />
                  <input value={newOpening.location} onChange={(e) => setNewOpening((s) => ({ ...s, location: e.target.value }))} placeholder="Location" className="p-2 border rounded" />
                  <input value={newOpening.salary} onChange={(e) => setNewOpening((s) => ({ ...s, salary: e.target.value }))} placeholder="Salary" className="p-2 border rounded" />
                  <select value={newOpening.type} onChange={(e) => setNewOpening((s) => ({ ...s, type: e.target.value as any }))} className="p-2 border rounded">
                    <option>Full-time</option>
                    <option>Internship</option>
                    <option>Contract</option>
                  </select>
                  <input value={newOpening.experience} onChange={(e) => setNewOpening((s) => ({ ...s, experience: e.target.value }))} placeholder="Experience" className="p-2 border rounded" />
                  <input type="date" value={String(newOpening.postedDate)} onChange={(e) => setNewOpening((s) => ({ ...s, postedDate: e.target.value }))} className="p-2 border rounded" />
                  <input type="number" value={Number(newOpening.applicants || 0)} onChange={(e) => setNewOpening((s) => ({ ...s, applicants: Number(e.target.value) }))} placeholder="Applicants" className="p-2 border rounded" />
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                  <button
                    onClick={async () => {
                      // basic validation
                      if (!newOpening.title || !newOpening.company) {
                        alert("Please enter title and company")
                        return
                      }

                      try {
                        const payload = {
                          title: String(newOpening.title),
                          company: String(newOpening.company),
                          location: String(newOpening.location || ""),
                          salary: String(newOpening.salary || ""),
                          type: (newOpening.type as any) || "Full-time",
                          experience: String(newOpening.experience || ""),
                          postedDate: String(newOpening.postedDate || new Date().toISOString().slice(0, 10)),
                          applicants: Number(newOpening.applicants || 0),
                          status: (newOpening.status as any) || "open",
                        }

                        if (editingId) {
                          const response = await placementAPI.updateDrive(editingId, payload)
                          const updated: JobOpening = {
                            id: response.data._id || response.data.id || editingId,
                            title: response.data.title || payload.title,
                            company: response.data.company || payload.company,
                            location: response.data.location || payload.location,
                            salary: response.data.salary || payload.salary,
                            type: response.data.type || payload.type,
                            experience: response.data.experience || payload.experience,
                            postedDate: response.data.postedDate ? new Date(response.data.postedDate).toISOString().slice(0, 10) : payload.postedDate,
                            applicants: response.data.applicants || payload.applicants,
                            status: response.data.status || payload.status
                          }
                          setOpenings((prev) => prev.map((o) => o.id === editingId ? updated : o))
                        } else {
                          const response = await placementAPI.createDrive(payload)

                          // Add the new opening from backend response
                          const created: JobOpening = {
                            id: response.data._id || response.data.id || String(Date.now()), // Fallback
                            title: response.data.title || payload.title,
                            company: response.data.company || payload.company,
                            location: response.data.location || payload.location,
                            salary: response.data.salary || payload.salary,
                            type: response.data.type || payload.type,
                            experience: response.data.experience || payload.experience,
                            postedDate: response.data.postedDate ? new Date(response.data.postedDate).toISOString().slice(0, 10) : payload.postedDate,
                            applicants: response.data.applicants || payload.applicants || 0,
                            status: response.data.status || payload.status || "open"
                          }

                          setOpenings((prev) => [created, ...prev])
                        }

                        setShowModal(false)
                        setEditingId(null)
                        // reset form
                        setNewOpening({ title: "", company: "", location: "", salary: "", type: "Full-time", experience: "", postedDate: new Date().toISOString().slice(0, 10), applicants: 0, status: "open" })
                      } catch (error) {
                        console.error("Failed to save opening", error)
                        alert("Failed to save opening. Please try again.")
                      }
                    }}
                    className="px-4 py-2 rounded bg-purple-600 text-white"
                  >
                    {editingId ? "Save Changes" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="px-8 py-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Total Openings</h3>
                <div className="text-3xl font-bold text-white">{openings.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Open Positions</h3>
                <div className="text-3xl font-bold text-green-400">
                  {openings.filter((o) => o.status === "open").length}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Total Applicants</h3>
                <div className="text-3xl font-bold text-purple-400">
                  {openings.reduce((sum, o) => sum + o.applicants, 0)}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Closed</h3>
                <div className="text-3xl font-bold text-red-400">
                  {openings.filter((o) => o.status === "closed").length}
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
                  placeholder="Search by title or company..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all" className="bg-[#1a1d3e]">All Status</option>
                <option value="open" className="bg-[#1a1d3e]">Open</option>
                <option value="closed" className="bg-[#1a1d3e]">Closed</option>
              </select>
            </div>

            {/* Openings Table */}
            <div className="overflow-x-auto bg-white/5 rounded-xl p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-3 text-white/80">ID</th>
                    <th className="px-4 py-3 text-white/80">Title</th>
                    <th className="px-4 py-3 text-white/80">Company</th>
                    <th className="px-4 py-3 text-white/80">Location</th>
                    <th className="px-4 py-3 text-white/80">Type</th>
                    <th className="px-4 py-3 text-white/80">Salary</th>
                    <th className="px-4 py-3 text-white/80">Posted</th>
                    <th className="px-4 py-3 text-white/80">Applicants</th>
                    <th className="px-4 py-3 text-white/80">Status</th>
                    <th className="px-4 py-3 text-white/80">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredOpenings.map((o) => (
                    <tr key={o.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-white/80">{o.id}</td>
                      <td className="px-4 py-3 text-white font-medium">{o.title}</td>
                      <td className="px-4 py-3 text-white/70">{o.company}</td>
                      <td className="px-4 py-3 text-white/70">{o.location}</td>
                      <td className="px-4 py-3 text-white/70">{o.type}</td>
                      <td className="px-4 py-3 text-white/70">{o.salary}</td>
                      <td className="px-4 py-3 text-white/70">{o.postedDate}</td>
                      <td className="px-4 py-3 text-purple-400 font-bold">{o.applicants}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${o.status === "open" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {o.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.location.href = `/placement/drives/${o.id}/candidates`}
                            className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition shadow-sm"
                            title="View Candidates"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(o)}
                            className="p-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition shadow-sm"
                            title="Edit Opening"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(o.id)}
                            className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition shadow-sm"
                            title="Delete Opening"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOpenings.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No job openings found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
