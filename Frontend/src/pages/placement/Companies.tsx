"use client"

import { useEffect, useMemo, useState } from "react"
import { TrendingUp, Plus, Search, Trash2, MapPin, Users, Star, FileText } from "lucide-react"
import PlacementSidebar from "@/components/placement-sidebar"
import { companiesAPI } from "@/lib/api"
import type { Company } from "@/types/company"
import { useAuth } from "@/contexts/AuthContext"

export default function PlacementCompaniesPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [minAtsScore, setMinAtsScore] = useState<number | "">("")
  const [minJobMatchScore, setMinJobMatchScore] = useState<number | "">("")
  const [allowedDepartments, setAllowedDepartments] = useState("")
  const [allowedBatches, setAllowedBatches] = useState("")
  const [minResumeCompletion, setMinResumeCompletion] = useState<number | "">("")
  const [requiredSkills, setRequiredSkills] = useState("")

  // Shortlist State
  const [showShortlist, setShowShortlist] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [shortlistData, setShortlistData] = useState<any>(null)
  const [shortlistLoading, setShortlistLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const canManage = useMemo(
    () => {
      const role = (user?.role || "").toLowerCase()
      return role === "admin" || role === "placement_officer" || role === "placement" || role === "principal"
    },
    [user?.role]
  )

  const loadCompanies = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await companiesAPI.list()
      setCompanies(res.data)
    } catch (e: any) {
      setError("Failed to load companies")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const onCreate = async () => {
    const criteria = {
      minAtsScore: minAtsScore === "" ? 0 : Number(minAtsScore),
      minJobMatchScore: minJobMatchScore === "" ? 0 : Number(minJobMatchScore),
      allowedDepartments: allowedDepartments
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      allowedBatches: allowedBatches
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      minResumeCompletion: minResumeCompletion === "" ? 100 : Number(minResumeCompletion),
      requiredSkills: requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }
    try {
      setCreateError(null)
      await companiesAPI.create({ name, description, criteria })
      setShowCreate(false)
      setName("")
      setDescription("")
      setMinAtsScore("")
      setMinJobMatchScore("")
      setAllowedDepartments("")
      setAllowedBatches("")
      setMinResumeCompletion("")
      setRequiredSkills("")
      await loadCompanies()
    } catch (e: any) {
      setCreateError(e?.response?.data?.message || "Failed to create company. Please try again.")
    }
  }

  const onOpenShortlist = async (id: string) => {
    setSelectedCompanyId(id)
    setShowShortlist(true)
    setShortlistLoading(true)
    try {
      const res = await companiesAPI.getShortlist(id)
      setShortlistData(res.data)
    } catch (e) {
      setShortlistData(null)
    } finally {
      setShortlistLoading(false)
    }
  }

  const onRunShortlist = async () => {
    if (!selectedCompanyId) return
    setShortlistLoading(true)
    try {
      await companiesAPI.runShortlist(selectedCompanyId)
      // After running, fetch the updated list
      const res = await companiesAPI.getShortlist(selectedCompanyId)
      setShortlistData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setShortlistLoading(false)
    }
  }

  const onDelete = async (id: string) => {
    if (!canManage) return
    if (!window.confirm("Delete this company?")) return
    try {
      setDeleteError(null)
      await companiesAPI.remove(id)
      await loadCompanies()
    } catch (e: any) {
      setDeleteError(e?.response?.data?.message || "Failed to delete company.")
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <TrendingUp className="w-7 h-7" />
                <h1 className="text-2xl font-bold">Companies</h1>
              </div>
              {canManage && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-white/90 transition flex items-center gap-2 font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add Company
                </button>
              )}
            </div>
          </header>

          <div className="px-8 py-6">
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Total Companies</h3>
                <div className="text-3xl font-bold text-white">{companies.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">With Criteria</h3>
                <div className="text-3xl font-bold text-green-400">
                  {companies.filter((c) => !!c.criteria).length}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Branches Covered</h3>
                <div className="text-3xl font-bold text-purple-400">
                  {Array.from(
                    new Set(
                      companies
                        .flatMap((c) => c.criteria?.allowedDepartments || [])
                        .filter(Boolean)
                    )
                  ).length}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Avg Min ATS</h3>
                <div className="text-3xl font-bold text-yellow-400">
                  {Math.round(
                    companies.reduce((sum, c) => sum + (c.criteria?.minAtsScore || 0), 0) / (companies.length || 1)
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search companies by name..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {loading && <div className="text-white">Loading...</div>}
            {error && <div className="text-red-400 mb-4">{error}</div>}
            {deleteError && (
              <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/40 bg-red-500/15 text-red-200 flex items-center justify-between">
                <span>{deleteError}</span>
                <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-200 ml-4">✕</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCompanies.map((company) => (
                <div
                  key={company._id}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 hover:border-purple-500/30 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{company.name}</h3>
                      {!!(company as any).description && (
                        <p className="text-white/60 text-xs mb-2 line-clamp-2">{(company as any).description}</p>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>
                            Min ATS Score: {company.criteria?.minAtsScore ?? "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <Users className="w-4 h-4" />
                          <span>
                            Departments:{" "}
                            {(company.criteria?.allowedDepartments || []).join(", ") || "All"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <Star className="w-4 h-4" />
                          <span>
                            Skills: {(company.criteria?.requiredSkills || []).slice(0, 3).join(", ") || "-"}
                            {(company.criteria?.requiredSkills?.length || 0) > 3 ? "..." : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                      {/* View Shortlist button hidden per user request
                      <button
                        onClick={() => onOpenShortlist(company._id)}
                        className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition"
                        title="View Shortlist"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      */}
                      <button
                        onClick={() => onDelete(company._id)}
                        className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                        aria-label="Delete company"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredCompanies.length === 0 && !loading && (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No companies found</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {showShortlist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f1238] border border-white/10 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-xl font-bold">Shortlisted Students</h2>
              <button
                onClick={() => setShowShortlist(false)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-white/5 rounded-lg p-4 mb-4">
              {shortlistLoading ? (
                <div className="text-white text-center py-8">Loading...</div>
              ) : shortlistData?.results?.length > 0 ? (
                <table className="w-full text-left text-white">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Department</th>
                      <th className="pb-2">Batch</th>
                      <th className="pb-2 text-center">ATS Score</th>
                      <th className="pb-2 text-right">Match Score</th>
                      <th className="pb-2 text-right">Shortlisted Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortlistData.results.map((student: any) => (
                      <tr key={student.id} className="border-b border-white/5">
                        <td className="py-2">{student.name}</td>
                        <td className="py-2">{student.department}</td>
                        <td className="py-2">{student.batch}</td>
                        <td className="py-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${(student.atsScore || 0) >= 80 ? 'bg-green-500/20 text-green-400' :
                            (student.atsScore || 0) >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                            {student.atsScore || 0}%
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <span className={`px-2 py-1 rounded text-xs ${student.jobReady ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {student.jobMatchScore}%
                          </span>
                        </td>
                        <td className="py-2 text-right text-white/70 text-sm">
                          {student.shortlistedAt ? new Date(student.shortlistedAt).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-white/60">No students shortlisted yet.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <div className="text-white/50 text-sm mr-auto self-center">
                Total: {shortlistData?.count || 0}
              </div>
              <button
                onClick={() => setShowShortlist(false)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20"
              >
                Close
              </button>
              {canManage && (
                <button
                  onClick={onRunShortlist}
                  disabled={shortlistLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {shortlistLoading ? "Running..." : "Run Auto-Shortlist"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreate && canManage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[#0f1238] border border-white/10 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-white text-xl font-bold mb-4">Add Company</h2>
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Company name"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Company description"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={minAtsScore}
                  onChange={(e) => setMinAtsScore(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Min ATS Score"
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                />
                <input
                  type="number"
                  value={minJobMatchScore}
                  onChange={(e) =>
                    setMinJobMatchScore(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Min Job Match Score"
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                />
              </div>
              <input
                value={allowedDepartments}
                onChange={(e) => setAllowedDepartments(e.target.value)}
                placeholder="Allowed Departments (comma separated)"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
              <input
                value={allowedBatches}
                onChange={(e) => setAllowedBatches(e.target.value)}
                placeholder="Allowed Batches (comma separated, e.g. 2024, 2025)"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
              <input
                type="number"
                value={minResumeCompletion}
                onChange={(e) => setMinResumeCompletion(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Min Resume Completion % (Default 100)"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
              <input
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                placeholder="Required Skills (comma separated)"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
            </div>
            {createError && (
              <div className="mt-3 px-3 py-2 rounded bg-red-500/20 border border-red-500/40 text-sm text-red-200">
                {createError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={onCreate}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg"
                disabled={!name.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
