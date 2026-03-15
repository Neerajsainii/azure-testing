import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  User,
  Mail,
  Phone,
  Building2,
} from "lucide-react"
import { APP_ENV } from "@/config/env"

type Principal = {
  _id: string
  name: string
  email: string
  phone: string
  college: string
  status: "Active" | "Inactive"
  joinedAt: string
}

export default function PrincipalsPage() {
  const [principals, setPrincipals] = useState<Principal[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrincipals = async () => {
      try {
        const token = localStorage.getItem("token")

        const res = await fetch(`${APP_ENV.apiBaseUrl}/api/admin/principals`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()
        setPrincipals(data)
      } catch (err) {
      } finally {
        setLoading(false)
      }
    }

    fetchPrincipals()
  }, [])

  const filteredPrincipals = principals.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.college.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* Header */}
      <header className="h-auto md:h-20 px-4 md:px-8 py-3 flex items-center justify-between border-b border-white/5 bg-[#16103a]/30 backdrop-blur">
        <h1 className="text-xl font-bold">Principals</h1>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
            SA
          </div>
          <ChevronDown size={20} className="text-white/50" />
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {/* Actions */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search principals..."
              className="w-full bg-[#1a163f]/60 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm"
            />
          </div>

          <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 rounded-lg">
            <Plus size={18} />
            Add Principal
          </button>
        </div>

        {/* Table */}
        <div className="bg-[#1a163f]/60 rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <User size={20} />
            <h3 className="text-lg font-semibold">Principals</h3>
          </div>

          {/* States */}
          {loading && (
            <div className="p-10 text-center text-white/50">
              Loading principals...
            </div>
          )}

          {!loading && filteredPrincipals.length === 0 && (
            <div className="p-10 text-center text-white/50">
              No principals found
            </div>
          )}

          {!loading &&
            filteredPrincipals.map((p) => (
              <div
                key={p._id}
                className="px-6 py-4 flex flex-col md:flex-row gap-4 border-t border-white/5"
              >
                <div className="md:w-[30%]">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-white/50">{p.joinedAt}</div>
                </div>

                <div className="md:w-[25%] text-sm">
                  <div className="flex gap-2">
                    <Mail size={12} /> {p.email}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Phone size={12} /> {p.phone}
                  </div>
                </div>

                <div className="md:w-[20%] flex gap-2">
                  <Building2 size={14} /> {p.college}
                </div>

                <div className="md:w-[10%]">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      p.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="md:w-[15%] flex gap-3">
                  <button className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs">
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="p-1.5 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  )
}
