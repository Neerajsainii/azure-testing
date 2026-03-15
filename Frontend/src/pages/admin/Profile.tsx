import apiClient from "@/lib/api"
import { useEffect, useState } from "react"
import { Mail, MapPin, Pencil, Phone, Save, Shield, User } from "lucide-react"
import AdminSidebar from "@/components/admin-sidebar"
import { useAuth } from "@/contexts/AuthContext"

export default function AdminProfile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loginHistory, setLoginHistory] = useState<any[]>([])

  const [formData, setFormData] = useState<any>({
    fullName: user?.name || "Admin",
    email: user?.email || "admin@ston.com",
    phone: "",
    alternateEmail: "",
    emergencyContact: "",
    designation: "",
    employeeId: "",
    tenure: "",
    department: "",
    office: "",
    officeHours: "",
    location: "",
    permissions: "",
    achievements: "",
    bio: "",
  })

  // Fetch real profile data if available
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get("/api/admin/profile")
        if (res.data) {
          const d = res.data
          // Merge with existing form data to keep UI fields populated
          setFormData((prev: any) => ({
            ...prev,
            fullName: d.name || prev.fullName,
            email: d.email || prev.email,
            phone: d.phone || prev.phone,
            alternateEmail: d.alternateEmail || prev.alternateEmail,
            emergencyContact: d.emergencyContact || prev.emergencyContact,
            designation: d.designation || prev.designation,
            employeeId: d.employeeId || prev.employeeId,
            tenure: d.tenure || prev.tenure,
            department: d.department || prev.department,
            office: d.office || prev.office,
            officeHours: d.officeHours || prev.officeHours,
            location: d.location || prev.location,
            permissions: d.permissions || prev.permissions,
            achievements: d.achievements || prev.achievements,
            bio: d.bio || prev.bio,
          }))

          if (d.loginHistory) {
            setLoginHistory(d.loginHistory)
          }
        }
      } catch (e) {
        console.error("Failed to fetch admin profile", e)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    try {
      // Real backend update
      await apiClient.put("/api/admin/profile", {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        alternateEmail: formData.alternateEmail,
        emergencyContact: formData.emergencyContact,
        designation: formData.designation,
        employeeId: formData.employeeId,
        tenure: formData.tenure,
        department: formData.department,
        office: formData.office,
        officeHours: formData.officeHours,
        location: formData.location,
        permissions: formData.permissions,
        achievements: formData.achievements,
        bio: formData.bio,
      })
      alert("Profile updated successfully!") 
      setIsEditing(false)
    } catch (e) {
      console.error("Failed to save profile", e)
      alert("Failed to save changes to server")
    }
  }

  return (
    <div className="min-h-screen text-white">
      <AdminSidebar />
      <div
        className="min-h-screen ml-64"
        style={{
          background:
            "linear-gradient(135deg, rgba(5,6,22,1) 0%, rgba(12,23,56,1) 45%, rgba(18,35,82,1) 100%)",
        }}
      >
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">Admin Profile</h1>
                <p className="text-xs text-white/60">Profile & Access</p>
              </div>
            </div>
            {/* notifications removed from profile header per request */}
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-8 py-10">
          <div className="bg-white/5 border border-white/20 rounded-2xl p-8 shadow-xl">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold border-2 border-blue-400/40">
                  AD
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
                    <label className="block text-sm text-white/70 mb-2">Office</label>
                    <input
                      type="text"
                      value={formData.office}
                      onChange={(e) => setFormData({ ...formData, office: e.target.value })}
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
                    <label className="block text-sm text-white/70 mb-2">Access Permissions</label>
                    <input
                      type="text"
                      value={formData.permissions}
                      onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
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
                      className="px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition inline-flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
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
                      <p className="text-white/60">Permissions</p>
                      <p className="text-white/90 font-medium inline-flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        {formData.permissions}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-white/60">Achievements</p>
                      <p className="text-white/90 font-medium">{formData.achievements}</p>
                    </div>

                    {/* Login History Section */}
                    <div className="md:col-span-2 mt-4 pt-4 border-t border-white/10">
                      <p className="text-white/60 mb-2">Recent Login Activity</p>
                      {loginHistory.length > 0 ? (
                        <div className="space-y-2">
                          {loginHistory.slice(0, 5).map((log, idx) => (
                            <div key={idx} className="flex justify-between text-xs bg-white/5 p-2 rounded">
                              <span className="text-white/80">{new Date(log.time).toLocaleString()}</span>
                              <span className="text-white/50 font-mono">{log.ip || "Unknown IP"}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-white/40 italic">No history available</p>
                      )}
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
