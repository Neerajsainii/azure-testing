"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, Plus, Pencil, Trash2, Check, X, ExternalLink, Loader2 } from "lucide-react"
import StudentSidebar from "@/components/student-sidebar"
import { studentAPI } from "@/lib/api"

interface Certification {
  id: number
  name: string
  issuer: string
  date: string
  credentialUrl: string
}

export default function StudentCertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Certification>>({})

  useEffect(() => {
    loadCertifications()
  }, [])

  const loadCertifications = async () => {
    try {
      const res = await studentAPI.getMyResume()
      if (res.data && res.data.certifications) {
        const mapped = res.data.certifications.map((c: any, index: number) => ({
            id: c._id || index + 1,
            name: c.name,
            issuer: c.issuedBy || "",
            date: c.year || "",
            credentialUrl: c.credentialUrl || ""
        }))
        setCertifications(mapped)
      }
    } catch (error) {
      console.error("Failed to load certifications", error)
    }
  }

  const saveToBackend = async (newList: Certification[]) => {
      setLoading(true)
      try {
          const payload = {
              certifications: newList.map(c => ({
                  name: c.name,
                  issuedBy: c.issuer,
                  year: c.date,
                  credentialUrl: c.credentialUrl
              }))
          }
          await studentAPI.saveResume(payload)
          setCertifications(newList)
      } catch (error) {
          console.error("Failed to save certifications", error)
          alert("Failed to save certifications")
      } finally {
          setLoading(false)
      }
  }

  const addNew = () => {
    const newId = Date.now()
    const newCert = { id: newId, name: "", issuer: "", date: "", credentialUrl: "" }
    const newList = [...certifications, newCert]
    setCertifications(newList)
    startEdit(newCert)
  }

  const startEdit = (cert: Certification) => {
    setEditingId(cert.id)
    setEditForm({ ...cert })
  }

  const saveEdit = async (id: number) => {
    const newList = certifications.map((c) => (c.id === id ? { ...c, ...editForm } as Certification : c))
    await saveToBackend(newList)
    setEditingId(null)
    setEditForm({})
  }

  const deleteCert = async (id: number) => {
    if (confirm("Delete this certification?")) {
        const newList = certifications.filter((c) => c.id !== id)
        await saveToBackend(newList)
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
        <StudentSidebar />

        <main className="flex-1 ml-64">
          <header className="bg-gradient-to-r from-[#4c54d2] to-[#5b63d3] px-8 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <ShieldCheck className="w-7 h-7" />
                <h1 className="text-2xl font-bold">Certifications & Achievements</h1>
                {loading && <Loader2 className="w-5 h-5 animate-spin ml-2" />}
              </div>
              <button
                onClick={addNew}
                disabled={loading || editingId !== null}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 transition flex items-center gap-2 font-semibold disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add Certification
              </button>
            </div>
          </header>

          <div className="px-8 py-6 space-y-6">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl border border-white/10 hover:border-white/20 transition"
              >
                {editingId === cert.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Certification Name"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 text-lg font-semibold"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editForm.issuer || ""}
                        onChange={(e) => setEditForm({ ...editForm, issuer: e.target.value })}
                        placeholder="Issuing Organization"
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={editForm.date || ""}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        placeholder="Date (e.g., Jan 2024)"
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <input
                      type="url"
                      value={editForm.credentialUrl || ""}
                      onChange={(e) => setEditForm({ ...editForm, credentialUrl: e.target.value })}
                      placeholder="Credential URL"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(cert.id)}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-semibold"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                            setEditingId(null)
                            setEditForm({})
                        }}
                        className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition border border-white/20 flex items-center gap-2 font-semibold"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">{cert.name}</h3>
                      <p className="text-white/80 mb-1">{cert.issuer}</p>
                      <p className="text-sm text-white/60 mb-3">{cert.date}</p>
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-sm">View Credential</span>
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(cert)}
                        className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCert(cert.id)}
                        className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
             {certifications.length === 0 && (
              <div className="text-center py-12">
                <ShieldCheck className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No certifications added yet.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
