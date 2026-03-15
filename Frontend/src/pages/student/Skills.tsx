"use client"

import { useState, useEffect } from "react"
import { Sparkles, Plus, X, Loader2 } from "lucide-react"
import StudentSidebar from "@/components/student-sidebar"
import { studentAPI } from "@/lib/api"

export default function StudentSkillsPage() {
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      const res = await studentAPI.getMyResume()
      if (res.data && res.data.skills) {
        setSkills(res.data.skills)
      }
    } catch (error) {
      console.error("Failed to load skills", error)
    }
  }

  const saveSkills = async (updatedSkills: string[]) => {
      setLoading(true)
      try {
          await studentAPI.saveResume({ skills: updatedSkills })
          setSkills(updatedSkills)
      } catch (error) {
          console.error("Failed to save skills", error)
          alert("Failed to save skills")
      } finally {
          setLoading(false)
      }
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updated = [...skills, newSkill.trim()]
      saveSkills(updated)
      setNewSkill("")
    }
  }

  const deleteSkill = (skillToDelete: string) => {
    const updated = skills.filter(s => s !== skillToDelete)
    saveSkills(updated)
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
              <Sparkles className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Skills & Technologies</h1>
              {loading && <Loader2 className="w-5 h-5 animate-spin ml-2" />}
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Add New Skill */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Manage Skills</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="Enter a skill (e.g. Python, React, Team Leadership)"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={addSkill}
                  disabled={loading || !newSkill.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Skill
                </button>
              </div>
              <p className="text-white/40 text-sm mt-2">
                  Skills will be used for ATS scoring and resume generation.
              </p>
            </div>

            {/* Skills List */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
               <h2 className="text-xl font-bold text-white mb-4">Your Skills</h2>
               {skills.length === 0 ? (
                   <p className="text-white/50">No skills added yet.</p>
               ) : (
                   <div className="flex flex-wrap gap-3">
                       {skills.map((skill, index) => (
                           <div key={index} className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 px-4 py-2 rounded-full text-white">
                               <span>{skill}</span>
                               <button 
                                  onClick={() => deleteSkill(skill)}
                                  className="text-white/60 hover:text-white"
                               >
                                   <X className="w-3 h-3" />
                               </button>
                           </div>
                       ))}
                   </div>
               )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
