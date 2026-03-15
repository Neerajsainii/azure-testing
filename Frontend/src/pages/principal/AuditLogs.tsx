  "use client"

import { useState, useEffect } from "react"
import { FileText, Search, Filter, Download } from "lucide-react"
import PrincipalSidebar from "@/components/principal-sidebar"
import { principalAPI } from "@/lib/api"
import { format } from "date-fns"

// Helper to load external script (JSZip) at runtime
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

interface AuditLog {
  _id: string
  timestamp: string
  userId: any // Can be object (populated) or string
  action: string
  entityType: string
  entityId: any
  ipAddress: string
  // Frontend specific computed fields
  userDisplay?: string
  resourceDisplay?: string
  statusDisplay?: "success" | "failed"
}

export default function PrincipalAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const res = await principalAPI.getAuditLogs()
      // Map backend data to frontend format
      const mappedLogs = res.data.map((log: any) => ({
        ...log,
        userDisplay: log.userId?.email || log.userId?.name || "Unknown User",
        resourceDisplay: log.entityType ? `${log.entityType}: ${log.entityId}` : "-",
        statusDisplay: "success", // Defaulting to success as backend doesn't track status
        timestamp: format(new Date(log.timestamp || log.createdAt || new Date()), "yyyy-MM-dd HH:mm:ss")
      }))
      setLogs(mappedLogs)
    } catch (err) {
      console.error("Failed to load audit logs", err)
    } finally {
      setLoading(false)
    }
  }

  const [searchTerm, setSearchTerm] = useState("")

  // Filters state
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterAction, setFilterAction] = useState<string>("ALL")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterUser, setFilterUser] = useState<string>("")

  const actions = Array.from(new Set(logs.map((l) => l.action)))

  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch =
      q === "" ||
      (log.userDisplay || "").toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.resourceDisplay || "").toLowerCase().includes(q)

    if (!matchesSearch) return false
    if (filterAction !== "ALL" && log.action !== filterAction) return false
    // Status filter removed as backend doesn't support it yet, keeping strictly 'success' for UI consistency
    if (filterStatus !== "all" && "success" !== filterStatus) return false
    if (filterUser && !(log.userDisplay || "").toLowerCase().includes(filterUser.toLowerCase())) return false
    return true
  })

  // CustomDropdown component (local) to avoid native select white dropdown
  function CustomDropdown({
    items,
    value,
    onChange,
    labels,
  }: {
    items: string[]
    value: string
    onChange: (v: string) => void
    labels?: Record<string, string>
  }) {
    const [open, setOpen] = useState(false)
    return (
      <div className="relative mt-1">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left px-3 py-2 bg-transparent border border-white/10 rounded text-white flex items-center justify-between"
        >
          <span>{(labels && labels[value]) || value}</span>
          <svg className="w-4 h-4 text-white/60" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-full bg-[#0b1220] border border-white/10 rounded shadow-lg z-50">
            {items.map((it) => (
              <button
                key={it}
                onClick={() => {
                  onChange(it)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 hover:bg-white/5 transition ${it === value ? 'bg-white/5' : ''} text-white`}
              >
                {(labels && labels[it]) || it}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const exportLogs = async () => {
    try {
      // build CSV content
      const headers = ["Timestamp", "User", "Action", "Resource", "Status", "IP Address"]
      const rows = [headers.join(",")]
      for (const l of filteredLogs) {
        // escape commas
        const row = [l.timestamp, l.userDisplay, l.action, l.resourceDisplay, l.statusDisplay, l.ipAddress]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
        rows.push(row)
      }
      const csv = rows.join("\n")

      // load JSZip if not present
      if (!(window as any).JSZip) {
        // using jsDelivr CDN
        await loadScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")
      }

      const JSZip = (window as any).JSZip
      if (!JSZip) throw new Error("JSZip failed to load")

      const zip = new JSZip()
      zip.file("audit-logs.csv", csv)
      zip.file("readme.txt", "Exported audit logs from STON Admin\nGenerated: " + new Date().toISOString())

      const blob: Blob = await zip.generateAsync({ type: "blob" })

      const a = document.createElement("a")
      const url = URL.createObjectURL(blob)
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export failed:", err)
      alert("Failed to export logs: " + (err as Error).message)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-500/20 text-green-400"
      case "UPDATE":
        return "bg-blue-500/20 text-blue-400"
      case "DELETE":
        return "bg-red-500/20 text-red-400"
      case "LOGIN":
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
        <PrincipalSidebar />

        <main className="flex-1 ml-64">
          <header className="bg-gradient-to-r from-[#4c54d2] to-[#5b63d3] px-8 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <FileText className="w-7 h-7" />
                <h1 className="text-2xl font-bold">Audit Logs</h1>
              </div>
              <button onClick={exportLogs} className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 transition flex items-center gap-2 font-semibold">
                <Download className="w-4 h-4" />
                Export Logs
              </button>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Search and Filters */}
            <div className="mb-2 flex gap-4 items-start">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button onClick={() => setFiltersOpen((v) => !v)} className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition flex items-center gap-2 font-semibold">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {filtersOpen && (
              <div className="mb-6 flex justify-end">
                <div className="w-full md:w-1/3 bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-xs text-white/60">Action</label>
                    <CustomDropdown
                      items={["ALL", ...actions]}
                      value={filterAction}
                      onChange={(v) => setFilterAction(v)}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60">Status</label>
                    <CustomDropdown
                      items={["all", "success", "failed"]}
                      labels={{ all: "All", success: "Success", failed: "Failed" }}
                      value={filterStatus}
                      onChange={(v) => setFilterStatus(v)}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60">User</label>
                    <input value={filterUser} onChange={(e) => setFilterUser(e.target.value)} placeholder="Filter by user email" className="w-full mt-1 bg-transparent border border-white/10 rounded px-3 py-2 text-white" />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setFilterAction("ALL"); setFilterStatus("all"); setFilterUser("") }} className="px-3 py-2 text-sm text-white/60 hover:text-white">Clear</button>
                    <button onClick={() => setFiltersOpen(false)} className="px-3 py-2 bg-blue-600 rounded text-sm">Apply</button>
                  </div>
                </div>
              </div>
            )}

            {/* Logs Table */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-white font-semibold">Timestamp</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">User</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Action</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Resource</th>
                      {/* Status Column Hidden as backend doesn't support it yet */}
                      {/* <th className="px-6 py-4 text-left text-white font-semibold">Status</th> */}
                      <th className="px-6 py-4 text-left text-white font-semibold">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-white">Loading logs...</td>
                      </tr>
                    ) : filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-white/80 text-sm">{log.timestamp}</td>
                        <td className="px-6 py-4 text-white">{log.userDisplay}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/80">{log.resourceDisplay}</td>
                        {/* Status Column Hidden */}
                        {/* <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              log.statusDisplay === "success"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {log.statusDisplay?.toUpperCase()}
                          </span>
                        </td> */}
                        <td className="px-6 py-4 text-white/60 text-sm font-mono">{log.ipAddress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredLogs.length === 0 && !loading && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 text-lg">No logs found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
