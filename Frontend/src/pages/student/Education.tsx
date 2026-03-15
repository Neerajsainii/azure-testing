"use client"

import { useState, useEffect } from "react"
import { GraduationCap, Pencil, Trash2, Check, X, Plus, Loader2 } from "lucide-react"
import StudentSidebar from "@/components/student-sidebar"
import { studentAPI } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

export default function StudentEducationPage() {
  const { user } = useAuth()
  const [educationList, setEducationList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Current Education State
  const [currentEdu, setCurrentEdu] = useState({
    degree: "",
    specialization: "",
    college: "",
    board: "University",
    expectedYear: "",
    cgpa: "",
    status: "In Progress",
    startYear: "",
  })
  const [isEditingCurrent, setIsEditingCurrent] = useState(false)
  
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    degree: "",
    institution: "",
    year: "",
    score: "",
  })

  useEffect(() => {
    loadEducation()
  }, [])

  const loadEducation = async () => {
    try {
      const res = await studentAPI.getMyResume()
      if (res.data && res.data.education) {
        // Assume first entry is current education if marked or by convention?
        // Or we just treat all as a list.
        // Let's check if 'current' flag exists or separate field.
        // Backend schema has `education` array. 
        // We will treat the first item in the array as "Current" if available, 
        // or fetch from User profile (college/dept) as defaults.
        
        // For now, let's keep "Current Education" separate in UI but store it as index 0 in backend array?
        // Or better: store "Current Education" as a distinct object in local state 
        // and when saving, prepend it to the list sent to backend.
        
        // Let's fetch all education items
        const allEdu = res.data.education || []
        
        if (allEdu.length > 0) {
            // Take the first one as current? Or check for "In Progress"?
            // Let's assume the most recent (first) is current.
            const [first, ...rest] = allEdu
            
            // Map first item to currentEdu structure
            setCurrentEdu({
                degree: first.degree || "",
                specialization: first.specialization || "", // Backend might not have this specific field in array item, might need custom field
                college: first.institution || "",
                board: "University",
                expectedYear: first.year ? first.year.split("-")[1]?.trim() : "",
                startYear: first.year ? first.year.split("-")[0]?.trim() : "",
                cgpa: first.score || "",
                status: "In Progress"
            })
            
            // Map rest to previous education list
            const mappedRest = rest.map((edu: any, index: number) => ({
                ...edu,
                id: edu._id || index + 1
            }))
            setEducationList(mappedRest)
        } else {
            // Default from User Profile if resume is empty
            setCurrentEdu(prev => ({
                ...prev,
                college: user?.college || "",
                specialization: user?.department || ""
            }))
        }
      }
    } catch (error) {
      console.error("Failed to load education", error)
    }
  }

  const saveToBackend = async (current: any, previous: any[]) => {
      setLoading(true)
      try {
          // Combine Current + Previous into one array for backend
          const combinedEducation = [
              {
                  degree: current.degree,
                  institution: current.college,
                  year: `${current.startYear || ''} - ${current.expectedYear || ''}`,
                  score: current.cgpa
                  // specialization field is not in standard schema, maybe append to degree?
                  // or ignore for now.
              },
              ...previous.map(({ id, ...rest }) => rest)
          ]
          
          await studentAPI.saveResume({ education: combinedEducation })
          
          // Update local state
          // Re-fetch or just update local?
          // Let's just update local
      } catch (error) {
          console.error("Failed to save education", error)
          alert("Failed to save education")
      } finally {
          setLoading(false)
      }
  }

  const saveCurrentEdu = async () => {
      await saveToBackend(currentEdu, educationList)
      setIsEditingCurrent(false)
  }

  const startEdit = (edu: any) => {
    setEditingId(edu.id)
    setEditForm({
      degree: edu.degree || "",
      institution: edu.institution || "",
      year: edu.year || "",
      score: edu.score || "",
    })
  }

  const saveEdit = async (id: number) => {
    const newList = educationList.map((edu) =>
        edu.id === id ? { ...edu, ...editForm } : edu
    )
    setEducationList(newList) // Update UI immediately
    await saveToBackend(currentEdu, newList)
    setEditingId(null)
  }

  const deleteEducation = async (id: number) => {
    if (confirm("Are you sure you want to delete this?")) {
        const newList = educationList.filter((edu) => edu.id !== id)
        setEducationList(newList)
        await saveToBackend(currentEdu, newList)
    }
  }

  const addNewEducation = () => {
    const newId = Date.now() // temporary ID
    const newEdu = {
        id: newId,
        degree: "New Degree",
        institution: "",
        year: "",
        score: ""
    }
    const newList = [...educationList, newEdu]
    setEducationList(newList)
    startEdit(newEdu)
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
            <div className="flex items-center gap-3 text-white">
              <GraduationCap className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Education Details</h1>
              {loading && <Loader2 className="w-5 h-5 animate-spin ml-2" />}
            </div>
          </header>

          <div className="px-8 py-6 space-y-6">
            {/* Current Education */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Current Education</h2>
                {!isEditingCurrent ? (
                    <button 
                        onClick={() => setIsEditingCurrent(true)}
                        className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button 
                            onClick={saveCurrentEdu}
                            className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setIsEditingCurrent(false)}
                            className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Degree</label>
                  {isEditingCurrent ? (
                      <input 
                        value={currentEdu.degree}
                        onChange={(e) => setCurrentEdu({...currentEdu, degree: e.target.value})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                      />
                  ) : (
                      <div className="text-white font-semibold">{currentEdu.degree || "-"}</div>
                  )}
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Specialization</label>
                  {isEditingCurrent ? (
                      <input 
                        value={currentEdu.specialization}
                        onChange={(e) => setCurrentEdu({...currentEdu, specialization: e.target.value})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                      />
                  ) : (
                      <div className="text-white font-semibold">{currentEdu.specialization || "-"}</div>
                  )}
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">College</label>
                  {isEditingCurrent ? (
                      <input 
                        value={currentEdu.college}
                        onChange={(e) => setCurrentEdu({...currentEdu, college: e.target.value})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                      />
                  ) : (
                      <div className="text-white font-semibold">{currentEdu.college || "-"}</div>
                  )}
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Board</label>
                  <div className="text-white font-semibold">{currentEdu.board}</div>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Start Year</label>
                  {isEditingCurrent ? (
                      <input 
                        value={currentEdu.startYear}
                        onChange={(e) => setCurrentEdu({...currentEdu, startYear: e.target.value})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                      />
                  ) : (
                      <div className="text-white font-semibold">{currentEdu.startYear || "-"}</div>
                  )}
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Expected Graduation</label>
                  {isEditingCurrent ? (
                      <input 
                        value={currentEdu.expectedYear}
                        onChange={(e) => setCurrentEdu({...currentEdu, expectedYear: e.target.value})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                      />
                  ) : (
                      <div className="text-white font-semibold">{currentEdu.expectedYear || "-"}</div>
                  )}
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">CGPA</label>
                  {isEditingCurrent ? (
                      <input 
                        value={currentEdu.cgpa}
                        onChange={(e) => setCurrentEdu({...currentEdu, cgpa: e.target.value})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                      />
                  ) : (
                      <div className="text-white font-semibold">{currentEdu.cgpa || "-"}</div>
                  )}
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Status</label>
                  <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    {currentEdu.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Education */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Previous Education</h2>
                <button
                  onClick={addNewEducation}
                  disabled={loading || editingId !== null}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Education
                </button>
              </div>

              <div className="space-y-4">
                {educationList.map((edu) => (
                  <div
                    key={edu.id}
                    className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-white/20 transition"
                  >
                    {editingId === edu.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={editForm.degree}
                            onChange={(e) => setEditForm({ ...editForm, degree: e.target.value })}
                            placeholder="Degree/Title"
                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                          />
                          <input
                            type="text"
                            value={editForm.institution}
                            onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                            placeholder="School/College Name"
                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                          />
                          <input
                            type="text"
                            value={editForm.year}
                            onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                            placeholder="Year (e.g., 2020 - 2023)"
                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                          />
                          <input
                            type="text"
                            value={editForm.score}
                            onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
                            placeholder="Score/Percentage/CGPA"
                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(edu.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={() => {
                                setEditingId(null)
                                // If it was a new item (empty fields), remove it? 
                                // Simplified: just cancel edit.
                            }}
                            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition border border-white/20 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{edu.degree}</h3>
                          <p className="text-white/80">{edu.institution}</p>
                          <div className="flex gap-4 mt-2 text-sm text-white/60">
                            <span>{edu.year}</span>
                            <span>•</span>
                            <span>{edu.score}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(edu)}
                            className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEducation(edu.id)}
                            className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
