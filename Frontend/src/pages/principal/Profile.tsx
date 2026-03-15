import { useState, useEffect } from "react"
import { Mail, MapPin, Pencil, Phone, Save, User } from "lucide-react"
import PrincipalSidebar from "@/components/principal-sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { principalAPI } from "@/lib/api"

export default function PrincipalProfile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    alternateEmail: "",
    emergencyContact: "",
    office: "",
    location: "",
    department: "",
    designation: "",
    employeeId: "",
    tenure: "",
    qualifications: "",
    officeHours: "",
    achievements: "",
    bio: "",
  })

  useEffect(() => {
    principalAPI.getProfile().then(res => {
      if (res.data) {
        setFormData(prev => ({ ...prev, ...res.data }))
      }
    }).catch(err => {
      console.error("Failed to load profile", err)
    })
  }, [])

  const handleSave = async () => {
    try {
      setLoading(true)
      const res = await principalAPI.updateProfile(formData)
      if (res.data) {
        setFormData(prev => ({ ...prev, ...res.data }))
      }
      setIsEditing(false)
      alert("Profile updated successfully")
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white">
      <PrincipalSidebar />
      <div
        className="min-h-screen ml-64"
        style={{
          background:
            "linear-gradient(135deg, rgba(5,6,22,1) 0%, rgba(15,26,63,1) 50%, rgba(26,46,102,1) 100%)",
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">Principal Profile</h1>
                <p className="text-xs text-white/60">Profile & Contact</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-8 py-10">
          <div className="bg-white/5 border border-white/20 rounded-2xl p-8 shadow-xl">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold border-2 border-indigo-400/40">
                  PR
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{formData.fullName}</h2>
                  <p className="text-white/70 mt-1">{formData.office}</p>
                  <div className="mt-4 space-y-2 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{formData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{formData.alternateEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{formData.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{formData.emergencyContact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{formData.location}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing((prev) => !prev)}
                className="px-5 py-2.5 bg-white text-blue-700 rounded-lg font-semibold hover:bg-white/90 transition flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Alternate Email</label>
                    <input
                      type="email"
                      value={formData.alternateEmail}
                      onChange={(e) => setFormData({ ...formData, alternateEmail: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Emergency Contact</label>
                    <input
                      type="tel"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Office</label>
                    <input
                      type="text"
                      value={formData.office}
                      onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Designation</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Employee ID</label>
                    <input
                      type="text"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Tenure</label>
                    <input
                      type="text"
                      value={formData.tenure}
                      onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Office Hours</label>
                    <input
                      type="text"
                      value={formData.officeHours}
                      onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-white/70 mb-2">Qualifications</label>
                    <input
                      type="text"
                      value={formData.qualifications}
                      onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-white/70 mb-2">Achievements</label>
                    <textarea
                      rows={3}
                      value={formData.achievements}
                      onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-white/70 mb-2">Bio</label>
                    <textarea
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-white/80 leading-relaxed">
                  <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                  <p>{formData.bio}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-sm">
                    <div>
                      <p className="text-white/60">Department</p>
                      <p className="text-white/90 font-medium">{formData.department}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Designation</p>
                      <p className="text-white/90 font-medium">{formData.designation}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Employee ID</p>
                      <p className="text-white/90 font-medium">{formData.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Tenure</p>
                      <p className="text-white/90 font-medium">{formData.tenure}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Office Hours</p>
                      <p className="text-white/90 font-medium">{formData.officeHours}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Qualifications</p>
                      <p className="text-white/90 font-medium">{formData.qualifications}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-white/60">Achievements</p>
                      <p className="text-white/90 font-medium">{formData.achievements}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
