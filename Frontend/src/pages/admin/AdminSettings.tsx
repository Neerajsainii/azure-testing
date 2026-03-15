
"use client"

import { useEffect, useState } from "react"
import AdminSidebar from "@/components/admin-sidebar"
import { adminAPI } from "@/lib/api"
import { ChevronDown, User, Shield, Settings as SettingsIcon, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const SettingsPage = () => {
  const [adminName, setAdminName] = useState<string>("Syed Sameer")
  const [adminEmail, setAdminEmail] = useState<string>("admin@stoncv.com")
  const [sessionTimeout, setSessionTimeout] = useState<number>(30)
  const [platformMaintenance, setPlatformMaintenance] = useState<boolean>(false)
  const [auditLogging, setAuditLogging] = useState<boolean>(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [showChangePwd, setShowChangePwd] = useState<boolean>(false)
  const [currentPwd, setCurrentPwd] = useState<string>("")
  const [newPwd, setNewPwd] = useState<string>("")
  const [confirmPwd, setConfirmPwd] = useState<string>("")
  const [pwdMessage, setPwdMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const auth = useAuth()

  useEffect(() => {
    // initialize name/email from current auth session if available
    if (auth?.session?.user) {
      setAdminName(auth.session.user.name || adminName)
      setAdminEmail(auth.session.user.email || adminEmail)
    }
    
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getSettings()
      const s = res.data
      
      if (typeof s.sessionTimeoutMinutes === "number") setSessionTimeout(s.sessionTimeoutMinutes)
      if (typeof s.maintenanceMode === "boolean") setPlatformMaintenance(s.maintenanceMode)
      if (typeof s.auditLoggingEnabled === "boolean") setAuditLogging(s.auditLoggingEnabled)
      if (typeof s.notificationsEnabled === "boolean") setNotificationsEnabled(s.notificationsEnabled)
      if (s.updatedAt) setLastUpdated(new Date(s.updatedAt))
      
    } catch (err) {
      console.error("Failed to load admin settings:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateInfo = async () => {
    try {
      await adminAPI.updateProfile({ name: adminName, email: adminEmail })
      
      if (auth && typeof auth.updateProfile === "function") {
        await auth.updateProfile({ name: adminName, email: adminEmail })
      }
      
      setSaveMessage("Profile updated")
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (e) {
      console.error("Failed to update profile:", e)
      alert("Failed to update profile")
    }
  }

  const saveSettings = async (updates: any) => {
    try {
      const res = await adminAPI.updateSettings(updates)
      const s = res.data
      setLastUpdated(new Date(s.updatedAt))
      setSaveMessage("Settings saved")
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      console.error("Failed to save settings", err)
      setSaveMessage("Failed to save")
    }
  }

  const togglePlatform = () => {
    const newValue = !platformMaintenance
    setPlatformMaintenance(newValue)
    saveSettings({ maintenanceMode: newValue })
  }

  const toggleAudit = () => {
    const newValue = !auditLogging
    setAuditLogging(newValue)
    saveSettings({ auditLoggingEnabled: newValue })
  }

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled
    setNotificationsEnabled(newValue)
    saveSettings({ notificationsEnabled: newValue })
  }

  const handleSessionTimeoutChange = (val: number) => {
    setSessionTimeout(val)
  }
  
  const handleSessionTimeoutCommit = () => {
    saveSettings({ sessionTimeoutMinutes: sessionTimeout })
  }

  const openChangePassword = () => {
    setShowChangePwd(true)
    setPwdMessage(null)
    setCurrentPwd("")
    setNewPwd("")
    setConfirmPwd("")
  }

  const closeChangePassword = () => setShowChangePwd(false)

  const handleChangePassword = () => {
    if (!newPwd || newPwd !== confirmPwd) {
      setPwdMessage("Passwords do not match")
      return
    }

    const doChange = async () => {
      try {
        if (auth && typeof auth.changePassword === "function") {
          await auth.changePassword(currentPwd, newPwd)
        } else {
          // fallback: simulate
          await new Promise((r) => setTimeout(r, 400))
        }

        setPwdMessage("Password changed successfully")
        setTimeout(() => {
          setShowChangePwd(false)
          setPwdMessage(null)
        }, 1500)
      } catch (err) {
        setPwdMessage("Failed to change password")
      }
    }

    void doChange()
  }

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
        <header className="h-auto md:h-20 px-4 md:px-8 py-3 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Settings</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-white/90">Welcome, Admin</div>
            </div>

            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold border-2 border-blue-400/30">SA</div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1e1245]" />
            </div>

            <button className="text-white/50 hover:text-white transition">
              <ChevronDown size={20} />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <div className="max-w-4xl space-y-6">

            {/* Admin Account */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-6 text-white/80">
                <Shield size={20} />
                <h2 className="font-semibold">Admin Account</h2>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4">
                    <label className="text-sm text-white/60">Admin Name</label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full bg-[#1e1245]/50 border border-white/10 rounded-lg px-4 py-2.5 text-white/90 focus:outline-none focus:border-blue-500/50 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4">
                    <label className="text-sm text-white/60">Admin Email</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-[#1e1245]/50 border border-white/10 rounded-lg px-4 py-2.5 text-white/90 focus:outline-none focus:border-blue-500/50 transition"
                    />
                  </div>
                </div>

                <div className="w-full md:w-40 flex flex-col gap-3">
                  <button
                    onClick={handleUpdateInfo}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition shadow-lg shadow-blue-900/20"
                  >
                    Update Info
                  </button>
                  <button
                    onClick={openChangePassword}
                    className="text-xs text-white/50 hover:text-white transition text-left"
                  >
                    Change Password
                  </button>
                  {saveMessage && <div className="text-sm text-green-400">{saveMessage}</div>}
                </div>
              </div>
            </div>

            {/* Access Controls */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-6 text-white/80">
                <User size={20} />
                <h2 className="font-semibold">Access Controls</h2>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <label className="text-sm text-white/60 md:w-[200px]">Session Timeout (Minutes)</label>

                  <div className="flex-1 flex items-center gap-4">
                    <input
                      type="range"
                      min={5}
                      max={120}
                      value={sessionTimeout}
                      onChange={(e) => handleSessionTimeoutChange(Number(e.target.value))}
                      onMouseUp={handleSessionTimeoutCommit}
                      onTouchEnd={handleSessionTimeoutCommit}
                      className="w-full h-1 accent-blue-500"
                    />

                    <div className="bg-white/10 px-3 py-1 rounded text-sm font-medium">{sessionTimeout}</div>
                  </div>
                </div>

              </div>
            </div>

            {/* System Settings */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-6 text-white/80">
                <SettingsIcon size={20} />
                <h2 className="font-semibold">System Settings</h2>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-white/60">
                   <Loader2 className="animate-spin w-4 h-4"/> Loading settings...
                </div>
              ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-8">
                  <label className="text-sm text-white/60 w-[200px]">Platform Maintenance Mode</label>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlatform}
                      className={`w-11 h-6 rounded-full relative transition ${platformMaintenance ? 'bg-blue-600' : 'bg-white/10'}`}
                      aria-pressed={platformMaintenance}
                    >
                      <div className={`absolute top-1 ${platformMaintenance ? 'right-1' : 'left-1'} w-4 h-4 bg-white rounded-full transition`} />
                    </button>
                    <span className="text-sm text-white/90">{platformMaintenance ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <label className="text-sm text-white/60 w-[200px]">Enable Audit Logging</label>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAudit}
                      className={`w-11 h-6 rounded-full relative transition ${auditLogging ? 'bg-blue-600' : 'bg-white/10'}`}
                      aria-pressed={auditLogging}
                    >
                      <div className={`absolute top-1 ${auditLogging ? 'right-1' : 'left-1'} w-4 h-4 bg-white rounded-full transition`} />
                    </button>
                    <span className="text-sm text-white/90">{auditLogging ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <label className="text-sm text-white/60 w-[200px]">Enable Notifications</label>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleNotifications}
                      className={`w-11 h-6 rounded-full relative transition ${notificationsEnabled ? 'bg-blue-600' : 'bg-white/10'}`}
                      aria-pressed={notificationsEnabled}
                    >
                      <div className={`absolute top-1 ${notificationsEnabled ? 'right-1' : 'left-1'} w-4 h-4 bg-white rounded-full transition`} />
                    </button>
                    <span className="text-sm text-white/90">{notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                <div className="text-sm text-white/60">Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}</div>
              </div>
              )}
            </div>

          </div>
        </div>
        </div>

        {/* Change Password Modal (simple client-side simulation) */}
        {showChangePwd && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md bg-[#0b1220] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm text-white/60">Current Password</label>
                  <input value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} type="password" className="w-full mt-1 bg-[#1e1245]/30 border border-white/10 rounded px-3 py-2 text-white" />
                </div>

                <div>
                  <label className="text-sm text-white/60">New Password</label>
                  <input value={newPwd} onChange={(e) => setNewPwd(e.target.value)} type="password" className="w-full mt-1 bg-[#1e1245]/30 border border-white/10 rounded px-3 py-2 text-white" />
                </div>

                <div>
                  <label className="text-sm text-white/60">Confirm New Password</label>
                  <input value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} type="password" className="w-full mt-1 bg-[#1e1245]/30 border border-white/10 rounded px-3 py-2 text-white" />
                </div>
              </div>

              {pwdMessage && <div className="text-sm text-amber-300 mb-3">{pwdMessage}</div>}

              <div className="flex justify-end gap-2">
                <button onClick={closeChangePassword} className="text-white/60 px-4 py-2 rounded">Cancel</button>
                <button onClick={handleChangePassword} className="bg-blue-600 px-4 py-2 rounded text-white">Change</button>
              </div>
            </div>
          </div>
        )}
      </div>
  )
}

export default SettingsPage
