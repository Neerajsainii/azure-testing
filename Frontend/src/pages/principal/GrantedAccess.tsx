
"use client"

import { useState, useEffect } from "react"
import { Lock, Search, Users, Shield, Loader2 } from "lucide-react"
import PrincipalSidebar from "@/components/principal-sidebar"
// import { principalAPI } from "@/lib/api"

interface AccessGrant {
  id: string
  userName: string
  userRole: string
  accessType: string
  grantedBy: string
  grantedDate: string
  expiryDate: string
  status: "active" | "expired"
  department: string
}

export default function PrincipalGrantedAccessPage() {
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    fetchAccessGrants()
  }, [])

  const fetchAccessGrants = async () => {
    try {
      setLoading(true)
      const { principalAPI } = await import("@/lib/api")
      const res = await principalAPI.getGrantedAccess()

      const usersList = Array.isArray(res.data) ? res.data : []
      const grants = usersList.map((u: any) => ({
        id: u.id || u._id,
        userName: u.name,
        userRole: u.role === "HOD" ? "HOD" : (u.role === "PLACEMENT_OFFICER" ? "Placement Officer" : u.role),
        accessType: u.role === "HOD" ? "Department Management" : "Placement Drive Management",
        grantedBy: "Principal",
        grantedDate: "N/A",
        expiryDate: "Indefinite",
        status: (u.status === "ACTIVE" ? "active" : (u.status === "INVITED" ? "invited" : "expired")) as "active" | "expired",
        department: u.department || "N/A"
      }))

      setAccessGrants(grants)
    } catch (error) {
      console.error("Failed to fetch access grants", error)
      setAccessGrants([])
    } finally {
      setLoading(false)
    }
  }


  const [editingGrant, setEditingGrant] = useState<AccessGrant | null>(null)

  const handleEditAccess = (grantId: string) => {
    const g = accessGrants.find((x) => x.id === grantId)
    if (g) setEditingGrant({ ...g })
  }

  const handleSaveEdit = () => {
    if (!editingGrant) return
    // In a real app, call API update here
    setAccessGrants((prev) => prev.map((g) => (g.id === editingGrant.id ? editingGrant : g)))
    setEditingGrant(null)
  }

  const handleRevokeAccess = (grantId: string) => {
    if (confirm("Are you sure you want to revoke this access?")) {
      // In a real app, call API to suspend user
      setAccessGrants(accessGrants.map((g) =>
        g.id === grantId ? { ...g, status: "expired" as const } : g
      ))
    }
  }

  const filteredGrants = accessGrants.filter((grant) => {
    const matchesSearch =
      grant.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grant.accessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grant.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || grant.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Helper to load external script (JSZip)
  function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve()
      const s = document.createElement("script")
      s.src = src
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error("Failed to load script: " + src))
      document.head.appendChild(s)
    })
  }

  const handleBulkDownload = async () => {
    try {
      if (!(window as any).JSZip) {
        await loadScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")
      }
      const JSZip = (window as any).JSZip
      if (!JSZip) throw new Error("JSZip failed to load")

      const zip = new JSZip()
      const folder = zip.folder("granted-access-reports")
      accessGrants.forEach((g) => {
        const content = `User: ${g.userName}\nRole: ${g.userRole}\nDepartment: ${g.department}\nAccess: ${g.accessType}\nStatus: ${g.status}`
        folder?.file(`${g.userName.replace(/\s+/g, "_")}_access.txt`, content)
      })

      const blob: Blob = await zip.generateAsync({ type: "blob" })
      const a = document.createElement("a")
      const url = URL.createObjectURL(blob)
      a.href = url
      a.download = `granted-access-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert("Failed to create bulk ZIP: " + (err as Error).message)
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
        <PrincipalSidebar />

        <main className="flex-1 ml-64">
          <header className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-8 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Lock className="w-7 h-7" />
                <h1 className="text-2xl font-bold">Granted Access</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBulkDownload}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-white/90 transition flex items-center gap-2 font-semibold soft-transition"
                >
                  <Lock className="w-4 h-4" />
                  Bulk Download
                </button>
                {/* <button
                  onClick={handleGrantAccess}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-white/90 transition flex items-center gap-2 font-semibold soft-transition lift-on-hover"
                >
                  <Plus className="w-4 h-4" />
                  Grant Access
                </button> */}
              </div>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 lift-on-hover fade-in">
                <h3 className="text-white/70 text-sm mb-2">Total Access Grants</h3>
                <div className="text-3xl font-bold text-white">{accessGrants.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 lift-on-hover fade-in">
                <h3 className="text-white/70 text-sm mb-2">Active</h3>
                <div className="text-3xl font-bold text-green-400">
                  {accessGrants.filter((g) => g.status === "active").length}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 lift-on-hover fade-in">
                <h3 className="text-white/70 text-sm mb-2">Expired/Revoked</h3>
                <div className="text-3xl font-bold text-red-400">
                  {accessGrants.filter((g) => g.status === "expired").length}
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
                  placeholder="Search access grants..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all" className="bg-[#1a1d3e]">All Status</option>
                <option value="active" className="bg-[#1a1d3e]">Active</option>
                <option value="expired" className="bg-[#1a1d3e]">Expired</option>
              </select>
            </div>

            {/* Access Grants Table */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-xl border border-white/10 fade-in">
              {loading ? (
                <div className="p-8 text-center text-white/60 flex justify-center items-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  Loading grants...
                </div>
              ) : filteredGrants.length === 0 ? (
                <div className="p-8 text-center text-white/60">No granted access records found.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-white font-semibold">User</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Role</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Department</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Access Type</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredGrants.map((grant) => (
                      <tr key={grant.id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-white">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-400" />
                            {grant.userName}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white/70">{grant.userRole}</td>
                        <td className="px-6 py-4 text-white/70">{grant.department}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-white/80">
                            <Shield className="w-4 h-4 text-indigo-400" />
                            {grant.accessType}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${grant.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                              }`}
                          >
                            {grant.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditAccess(grant.id)}
                              className="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition text-sm"
                            >
                              Edit
                            </button>
                            {grant.status === "active" && (
                              <button
                                onClick={() => handleRevokeAccess(grant.id)}
                                className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-sm"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* Edit modal */}
            {editingGrant && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-lg bg-[#0b1220] border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Edit Access Grant</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm text-white/60">User</label>
                      <input value={editingGrant.userName} disabled className="w-full mt-1 bg-[#1e1245]/30 border border-white/10 rounded px-3 py-2 text-white/50 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-sm text-white/60">Status</label>
                      <select value={editingGrant.status} onChange={(e) => setEditingGrant((s) => s ? { ...s, status: e.target.value as any } : s)} className="w-full mt-1 bg-[#1e1245]/30 border border-white/10 rounded px-3 py-2 text-white">
                        <option value="active">active</option>
                        <option value="expired">expired</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setEditingGrant(null)} className="px-3 py-2 rounded text-white/60">Cancel</button>
                    <button onClick={handleSaveEdit} className="px-3 py-2 bg-blue-600 rounded text-white">Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
