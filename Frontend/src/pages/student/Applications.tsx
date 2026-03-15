import { useState, useEffect } from "react"
import { Briefcase, Search, Calendar, Loader2, AlertCircle, Building2 } from "lucide-react"
import StudentSidebar from "@/components/student-sidebar"
import NotificationBell from "@/components/NotificationBell"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { studentAPI } from "@/lib/api"

interface Application {
    id: string
    driveId: string
    title: string
    company: string
    appliedAt: string
    finalStatus: string
    roundStatus: {
        aptitude: string
        gd: string
        interview: string
    }
}

export default function StudentApplications() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    const handleLogout = async () => {
        await logout()
        navigate("/login", { replace: true })
    }

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                setLoading(true)
                const response = await studentAPI.getApplications()
                setApplications(response.data.applications || [])
            } catch (err: any) {
                console.error("Failed to fetch applications", err)
                setError(err.message || "Failed to load applications")
            } finally {
                setLoading(false)
            }
        }
        fetchApplications()
    }, [])

    const filteredApplications = applications.filter(app =>
        app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company.toLowerCase().includes(searchTerm.toLowerCase())
    )

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

    const getStatusDisplay = (status: string) => {
        if (!status) return "Pending"
        return status.charAt(0).toUpperCase() + status.slice(1)
    }

    return (
        <div className="min-h-screen text-white">
            <StudentSidebar />
            <div
                className="min-h-screen ml-64 pb-10"
                style={{
                    background: "linear-gradient(135deg, #0a0a18 0%, #0f1238 50%, #2e3cb3 100%)",
                }}
            >
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
                    <div className="flex items-center justify-between px-8 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                                ST
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">My Applications</h1>
                                <p className="text-xs text-white/60">Track your interview progress</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <NotificationBell />
                            <div className="text-right">
                                <div className="text-sm font-medium">{user?.name || "Student"}</div>
                                <div className="text-xs text-white/60">{user?.email}</div>
                            </div>
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-8 py-10">
                    {/* Stats Row */}
                    {!loading && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <p className="text-white/60 text-sm mb-1">Total Applied</p>
                                <h3 className="text-3xl font-bold">{applications.length}</h3>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <p className="text-white/60 text-sm mb-1">Shortlisted</p>
                                <h3 className="text-3xl font-bold text-blue-400">
                                    {applications.filter(a => a.finalStatus === "shortlisted").length}
                                </h3>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <p className="text-white/60 text-sm mb-1">Offers</p>
                                <h3 className="text-3xl font-bold text-green-400">
                                    {applications.filter(a => ["offered", "joined"].includes(a.finalStatus)).length}
                                </h3>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <p className="text-white/60 text-sm mb-1">Rejected</p>
                                <h3 className="text-3xl font-bold text-red-400">
                                    {applications.filter(a => a.finalStatus === "rejected").length}
                                </h3>
                            </div>
                        </div>
                    )}

                    {/* Search */}
                    <div className="mb-8 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by role or company..."
                            className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 text-red-400 flex flex-col items-center gap-2">
                            <AlertCircle className="w-10 h-10" />
                            <p>{error}</p>
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="text-center py-20 text-white/60">
                            <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl">No applications found</p>
                            <p className="text-sm mt-2">You haven't applied to any drives yet or the list is filtered out.</p>
                            <Button onClick={() => navigate("/student/jobs")} className="mt-6 bg-blue-600 hover:bg-blue-700">
                                Browse Openings
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredApplications.map((app) => (
                                <div
                                    key={app.id}
                                    className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-black font-bold text-xl flex-shrink-0">
                                                    {app.company.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition line-clamp-1">
                                                        {app.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-white/60 mt-1">
                                                        <Building2 className="w-4 h-4" />
                                                        <span className="truncate max-w-[150px]">{app.company}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[app.finalStatus || "shortlisted"]}`}>
                                                    {getStatusDisplay(app.finalStatus || "shortlisted")}
                                                </span>
                                                <span className="text-xs text-white/40 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(app.appliedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-3">
                                            <p className="text-sm text-white/70 font-semibold mb-2 border-b border-white/10 pb-2">Round Status</p>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white/60">Aptitude</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[app.roundStatus?.aptitude || "pending"]}`}>
                                                    {getStatusDisplay(app.roundStatus?.aptitude)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white/60">Group Discussion</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[app.roundStatus?.gd || "pending"]}`}>
                                                    {getStatusDisplay(app.roundStatus?.gd)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white/60">Interview</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[app.roundStatus?.interview || "pending"]}`}>
                                                    {getStatusDisplay(app.roundStatus?.interview)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
