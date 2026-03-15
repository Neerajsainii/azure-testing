import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Users, Search, ChevronLeft, Loader2 } from "lucide-react"
import PlacementSidebar from "@/components/placement-sidebar"
import { placementAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"

interface Candidate {
    id: string
    name: string
    email: string
    department: string
    year: number
    cgpa: number
    eligibilityReason: string
    roundStatus: {
        aptitude: string
        gd: string
        interview: string
    }
    finalStatus: string
    packageOffered: number | null
    offerDate: string | null
    remarks: string
}

export default function DriveCandidatesPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [loading, setLoading] = useState(true)
    const [driveDetails, setDriveDetails] = useState<any>(null)

    const [searchTerm, setSearchTerm] = useState("")
    const [filterFinalStatus, setFilterFinalStatus] = useState("all")

    const fetchCandidates = async () => {
        if (!id) return
        try {
            setLoading(true)
            const [driveRes, candRes] = await Promise.all([
                placementAPI.getDrive(id),
                placementAPI.getDriveCandidates(id, { limit: 500 }) // Load up to 500 candidates for now
            ])
            setDriveDetails(driveRes.data)
            setCandidates(candRes.data.candidates || [])
        } catch (error) {
            console.error("Failed to fetch drive or candidates", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCandidates()
    }, [id])

    const filteredCandidates = candidates.filter((c) => {
        const matchesSearch =
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.department.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = filterFinalStatus === "all" || c.finalStatus === filterFinalStatus
        return matchesSearch && matchesStatus
    })

    const updateRoundStatus = async (studentId: string, round: "aptitude" | "gd" | "interview", status: string) => {
        if (!id) return
        try {
            await placementAPI.updateCandidateRoundStatus(id, studentId, { [round]: status })
            // Optimistically update
            setCandidates(prev => prev.map(c =>
                c.id === studentId ? { ...c, roundStatus: { ...c.roundStatus, [round]: status } } : c
            ))
        } catch (error) {
            console.error("Failed to update round status", error)
            alert("Failed to update status")
        }
    }

    const updateFinalStatus = async (studentId: string, status: string) => {
        if (!id) return
        try {
            await placementAPI.updateCandidateFinalStatus(id, studentId, { finalStatus: status })
            setCandidates(prev => prev.map(c =>
                c.id === studentId ? { ...c, finalStatus: status } : c
            ))
        } catch (error) {
            console.error("Failed to update final status", error)
            alert("Failed to update status")
        }
    }

    const handleUpdateOffer = async (studentId: string, candidateName: string) => {
        if (!id) return
        const pkg = prompt(`Enter package offered to ${candidateName} (in LPA):`)
        if (pkg === null) return // Cancelled

        try {
            await placementAPI.updateCandidateOffer(id, studentId, {
                packageOffered: Number(pkg),
                offerDate: new Date().toISOString()
            })
            fetchCandidates() // Refresh completely to get exact dates and status
        } catch (error) {
            console.error("Failed to update offer", error)
            alert("Failed to save offer details")
        }
    }

    const statusColors: Record<string, string> = {
        pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
        qualified: "text-blue-400 bg-blue-400/10 border-blue-400/20",
        rejected: "text-red-400 bg-red-400/10 border-red-400/20",
        absent: "text-gray-400 bg-gray-400/10 border-gray-400/20",
        shortlisted: "text-amber-400 bg-amber-400/10 border-amber-400/20",
        offered: "text-green-400 bg-green-400/10 border-green-400/20",
        joined: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        declined: "text-orange-400 bg-orange-400/10 border-orange-400/20"
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
                        <div className="flex items-center gap-4 text-white">
                            <button
                                onClick={() => navigate('/placement/openings')}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Manage Candidates</h1>
                                <p className="text-sm text-white/80">{driveDetails?.title || "Loading drive..."}</p>
                            </div>
                        </div>
                    </header>

                    <div className="px-8 py-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                            </div>
                        ) : (
                            <>
                                {/* Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                                        <h3 className="text-white/70 text-sm mb-2">Total Candidates</h3>
                                        <div className="text-3xl font-bold text-white">{candidates.length}</div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                                        <h3 className="text-white/70 text-sm mb-2">Shortlisted</h3>
                                        <div className="text-3xl font-bold text-blue-400">
                                            {candidates.filter((c) => c.finalStatus === "shortlisted").length}
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                                        <h3 className="text-white/70 text-sm mb-2">Offered/Joined</h3>
                                        <div className="text-3xl font-bold text-green-400">
                                            {candidates.filter((c) => ["offered", "joined"].includes(c.finalStatus)).length}
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                                        <h3 className="text-white/70 text-sm mb-2">Rejected</h3>
                                        <div className="text-3xl font-bold text-red-400">
                                            {candidates.filter((c) => c.finalStatus === "rejected").length}
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
                                            placeholder="Search candidate name, email, or department..."
                                            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition"
                                        />
                                    </div>
                                    <select
                                        value={filterFinalStatus}
                                        onChange={(e) => setFilterFinalStatus(e.target.value)}
                                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="all" className="bg-[#1a1d3e]">All Status</option>
                                        <option value="shortlisted" className="bg-[#1a1d3e]">Shortlisted</option>
                                        <option value="offered" className="bg-[#1a1d3e]">Offered</option>
                                        <option value="joined" className="bg-[#1a1d3e]">Joined</option>
                                        <option value="rejected" className="bg-[#1a1d3e]">Rejected</option>
                                    </select>
                                </div>

                                {/* Candidates Table */}
                                <div className="overflow-x-auto bg-white/5 rounded-xl border border-white/10">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left bg-white/5 border-b border-white/10">
                                                <th className="px-4 py-4 font-semibold text-white/80">Candidate Info</th>
                                                <th className="px-4 py-4 font-semibold text-white/80">Aptitude</th>
                                                <th className="px-4 py-4 font-semibold text-white/80">Group Disc.</th>
                                                <th className="px-4 py-4 font-semibold text-white/80">Interview</th>
                                                <th className="px-4 py-4 font-semibold text-white/80">Final Status</th>
                                                <th className="px-4 py-4 font-semibold text-white/80 text-right">Offer Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredCandidates.map((c) => (
                                                <tr key={c.id} className="hover:bg-white/[0.02] transition">
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-medium">{c.name}</span>
                                                            <span className="text-white/50 text-xs">{c.email}</span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-purple-300 text-xs">{c.department}</span>
                                                                <span className="text-white/40 text-xs">•</span>
                                                                <span className="text-white/60 text-xs text-nowrap">CGPA: {c.cgpa}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={c.roundStatus?.aptitude || "pending"}
                                                            onChange={(e) => updateRoundStatus(c.id, "aptitude", e.target.value)}
                                                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none appearance-none cursor-pointer ${statusColors[c.roundStatus?.aptitude || "pending"]}`}
                                                        >
                                                            <option value="pending" className="bg-[#1a1d3e] text-white">Pending</option>
                                                            <option value="qualified" className="bg-[#1a1d3e] text-white">Qualified</option>
                                                            <option value="rejected" className="bg-[#1a1d3e] text-white">Rejected</option>
                                                            <option value="absent" className="bg-[#1a1d3e] text-white">Absent</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={c.roundStatus?.gd || "pending"}
                                                            onChange={(e) => updateRoundStatus(c.id, "gd", e.target.value)}
                                                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none appearance-none cursor-pointer ${statusColors[c.roundStatus?.gd || "pending"]}`}
                                                        >
                                                            <option value="pending" className="bg-[#1a1d3e] text-white">Pending</option>
                                                            <option value="qualified" className="bg-[#1a1d3e] text-white">Qualified</option>
                                                            <option value="rejected" className="bg-[#1a1d3e] text-white">Rejected</option>
                                                            <option value="absent" className="bg-[#1a1d3e] text-white">Absent</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={c.roundStatus?.interview || "pending"}
                                                            onChange={(e) => updateRoundStatus(c.id, "interview", e.target.value)}
                                                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none appearance-none cursor-pointer ${statusColors[c.roundStatus?.interview || "pending"]}`}
                                                        >
                                                            <option value="pending" className="bg-[#1a1d3e] text-white">Pending</option>
                                                            <option value="qualified" className="bg-[#1a1d3e] text-white">Qualified</option>
                                                            <option value="rejected" className="bg-[#1a1d3e] text-white">Rejected</option>
                                                            <option value="absent" className="bg-[#1a1d3e] text-white">Absent</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={c.finalStatus || "shortlisted"}
                                                            onChange={(e) => updateFinalStatus(c.id, e.target.value)}
                                                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none appearance-none cursor-pointer ${statusColors[c.finalStatus || "shortlisted"]}`}
                                                        >
                                                            <option value="shortlisted" className="bg-[#1a1d3e] text-white">Shortlisted</option>
                                                            <option value="rejected" className="bg-[#1a1d3e] text-white">Rejected</option>
                                                            <option value="offered" className="bg-[#1a1d3e] text-white">Offered</option>
                                                            <option value="joined" className="bg-[#1a1d3e] text-white">Joined</option>
                                                            <option value="declined" className="bg-[#1a1d3e] text-white">Declined</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        {c.finalStatus === "offered" || c.finalStatus === "joined" || c.packageOffered ? (
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded text-xs">{c.packageOffered} LPA</span>
                                                                <button onClick={() => handleUpdateOffer(c.id, c.name)} className="text-xs text-purple-400 hover:text-purple-300 underline">Edit Offer</button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-purple-500/30 hover:bg-purple-500/20 text-purple-300 h-8 text-xs"
                                                                onClick={() => handleUpdateOffer(c.id, c.name)}
                                                            >
                                                                Add Offer
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredCandidates.length === 0 && (
                                        <div className="py-12 text-center text-white/50">
                                            No candidates match your filters.
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
