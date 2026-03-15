"use client"

import { useState, useEffect } from "react"
import {
  Camera,
  Mail,
  Phone,
  User,
  Pencil,
  MessageSquare,
  MapPin,
  Github,
  Linkedin,
  Globe,
  Loader2,
} from "lucide-react"
import StudentSidebar from "@/components/student-sidebar"
import { studentAPI } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

export default function StudentProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileImage, setProfileImage] = useState("/image/STON.png")

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    linkedin: "",
    github: "",
    portfolio: "",
    department: "",
    year: "",
    institute: "",
  })

  const [stats, setStats] = useState({
    resumeCompletion: 0,
    atsScore: 0,
    applicationsCount: 0,
  })

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)

      const [profileRes, dashboardRes, applicationsRes] = await Promise.allSettled([
        studentAPI.getProfile(),
        studentAPI.getDashboard(),
        studentAPI.getApplications(),
      ])

      if (profileRes.status === "fulfilled") {
        const data = profileRes.value.data
        setFormData({
          fullName: data.personalInfo?.fullName || user?.name || "",
          email: data.personalInfo?.email || user?.email || "",
          phone: data.personalInfo?.phone || "",
          address: data.personalInfo?.address || "",
          linkedin: data.personalInfo?.linkedin || "",
          github: data.personalInfo?.github || "",
          portfolio: data.personalInfo?.portfolio || "",
          department: data.department || "",
          year: data.year || "",
          institute: data.college || "",
        })
        if (user?.profile_photo) {
          setProfileImage(user.profile_photo)
        }
      }

      setStats(prev => ({
        ...prev,
        resumeCompletion: dashboardRes.status === "fulfilled" ? (dashboardRes.value.data.resumeCompletion || 0) : prev.resumeCompletion,
        atsScore: dashboardRes.status === "fulfilled" ? (dashboardRes.value.data.atsScore || 0) : prev.atsScore,
        applicationsCount: applicationsRes.status === "fulfilled" ? (applicationsRes.value.data.count || 0) : prev.applicationsCount,
      }))

    } catch (error) {
      console.error("Failed to load profile", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setProfileImage(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      await studentAPI.updateProfile({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        linkedin: formData.linkedin,
        github: formData.github,
        portfolio: formData.portfolio,
        department: formData.department,
        year: formData.year,
        college: formData.institute,
        profile_photo: profileImage
      })
      setIsEditing(false)
      await loadProfile() // Reload to confirm
      alert("Profile updated successfully")
    } catch (error) {
      console.error("Failed to update profile", error)
      alert("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1238] text-white">
        Loading...
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #1e2a78 0%, #2d3a8c 25%, #1a1d3e 60%, #0f1238 100%)",
      }}
    >
      <div className="flex">
        <StudentSidebar />

        {/* Main Content */}
        <main className="flex-1 ml-64">
          {/* Header */}
          <header className="bg-gradient-to-r from-[#4c54d2] to-[#5b63d3] px-8 py-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3 text-white">
              <User className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Student Profile</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-white/20 transition">
                <MessageSquare className="w-5 h-5 text-white" />
              </button>
            </div>
          </header>

          {/* Hero Profile Section */}
          <div className="bg-gradient-to-r from-[#5865f2] via-[#5b63d3] to-[#7289da] px-8 py-8 mx-8 mt-6 rounded-xl shadow-2xl">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-6 flex-1">
                {/* Profile Image */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img
                      src={profileImage}
                      alt={formData.fullName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                {/* Profile Info */}
                <div className="flex flex-col justify-start gap-4 flex-1">
                  <div>
                    <h1 className="text-4xl font-bold text-white">{formData.fullName}</h1>
                    <div className="flex items-center gap-2 mt-2 text-white/90">
                      <p className="text-lg">
                        {formData.department ? `${formData.department} - ${formData.year} Year` : "Student"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-white/80">
                      <p className="text-md">{formData.institute}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4 text-white/90">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{formData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{formData.phone || "No phone added"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{formData.address || "No address added"}</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-4 mt-2">
                    {formData.github && (
                      <a href={formData.github} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition">
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {formData.linkedin && (
                      <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {formData.portfolio && (
                      <a href={formData.portfolio} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition">
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-white/90 transition flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="px-8 py-6">
            {isEditing ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6">Edit Profile Information</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white mb-2 text-sm font-medium">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm font-medium">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm font-medium">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm font-medium">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm font-medium">Year</label>
                    <input
                      type="text"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm font-medium">College / Institute</label>
                    <input
                      type="text"
                      value={formData.institute}
                      onChange={(e) => setFormData({ ...formData, institute: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Unsupported fields hidden: Location, GitHub, LinkedIn, Portfolio, Bio */}
                  <div>
                    <label className="block text-white mb-2 text-sm font-medium">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm font-medium">LinkedIn URL</label>
                    <input
                      type="text"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm font-medium">GitHub URL</label>
                    <input
                      type="text"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm font-medium">Portfolio URL</label>
                    <input
                      type="text"
                      value={formData.portfolio}
                      onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                </div>
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-8 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition border border-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl">
                {/* Bio section removed as it's not supported by backend */}

                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-2">Resume Completion</h3>
                    <div className="text-3xl font-bold text-blue-400">
                      {stats.resumeCompletion}%
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-2">ATS Score</h3>
                    <div className="text-3xl font-bold text-green-400">{stats.atsScore}/100</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-2">Applications</h3>
                    <div className="text-3xl font-bold text-purple-400">{stats.applicationsCount}</div>
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
