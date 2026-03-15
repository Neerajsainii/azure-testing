import { useEffect, useState } from "react"
import AdminSidebar from "@/components/admin-sidebar"
import { adminAPI } from "@/lib/api"
import { Building2, Edit, Check, X } from "lucide-react"

interface CollegeCapacity {
  _id: string
  name: string
  isActive: boolean
  departmentLimit: number | null
  departmentCount: number
  remainingDepartmentSlots: number | null
}

export default function DepartmentLimitsPage() {
  const [colleges, setColleges] = useState<CollegeCapacity[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newLimit, setNewLimit] = useState<string>("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await adminAPI.getPlatformColleges()
      setColleges(res.data || [])
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load colleges")
    } finally {
      setLoading(false)
    }
  }

  const beginEdit = (college: CollegeCapacity) => {
    setEditingId(college._id)
    setNewLimit(college.departmentLimit === null ? "0" : String(college.departmentLimit))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewLimit("")
  }

  const openConfirm = (id: string) => {
    setPendingId(id)
    setConfirmOpen(true)
  }

  const applyUpdate = async () => {
    if (!pendingId) return
    setConfirmOpen(false)
    setLoading(true)
    setError("")
    try {
      const limitNum = Number(newLimit)
      const res = await adminAPI.updatePlatformCollegeDepartmentLimit(pendingId, limitNum)
      setColleges((prev) =>
        prev.map((c) => (c._id === pendingId ? { ...c, ...res.data } : c))
      )
      setEditingId(null)
      setNewLimit("")
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to update department limit")
    } finally {
      setLoading(false)
      setPendingId(null)
    }
  }

  const remainingLabel = (c: CollegeCapacity) =>
    c.remainingDepartmentSlots === null ? "∞" : c.remainingDepartmentSlots

  return (
    <div className="min-h-screen text-white">
      <AdminSidebar />
      <div
        className="min-h-screen ml-64 pb-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(5,6,22,1) 0%, rgba(15,26,63,1) 50%, rgba(26,46,102,1) 100%)",
        }}
      >
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur">
          <div className="flex items-center gap-3 px-8 py-4">
            <Building2 className="w-6 h-6 text-blue-400" />
            <h1 className="text-lg font-semibold">Department Limits</h1>
          </div>
        </header>

        <div className="p-6">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/40 bg-red-500/15 text-red-200">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {colleges.map((c) => {
                const isEditing = editingId === c._id
                return (
                  <div
                    key={c._id}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold">{c.name}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${c.isActive ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-sm text-white/70 mb-2">
                      Departments: {c.departmentCount} • Remaining: {remainingLabel(c)}
                    </div>
                    {!isEditing ? (
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-white/80">
                          Limit: {c.departmentLimit === null ? "Unlimited" : c.departmentLimit}
                        </div>
                        <button
                          onClick={() => beginEdit(c)}
                          className="ml-auto px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={newLimit}
                          onChange={(e) => setNewLimit(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                          placeholder="0 for Unlimited"
                        />
                        <button
                          onClick={() => openConfirm(c._id)}
                          className="px-3 py-2 rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f1238] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <div className="text-white text-lg font-semibold mb-2">Confirm Update</div>
            <div className="text-white/80 text-sm mb-4">
              Set department limit to {newLimit === "0" ? "Unlimited" : newLimit}? This affects college-wide quota.
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={applyUpdate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
