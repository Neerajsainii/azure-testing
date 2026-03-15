
"use client"

import { useState, useEffect } from "react"
import { Sparkles, Plus, Pencil, Trash2, Check, X, ExternalLink, Github, Loader2, Zap } from "lucide-react"
import StudentSidebar from "@/components/student-sidebar"
import { studentAPI } from "@/lib/api"

interface Project {
  id: number
  title: string
  description: string
  technologies: string[]
  githubUrl: string
  liveUrl: string
  duration: string
  level: "Industrial" | "Academic" | ""
}

interface EvaluationResult {
  score: number
  relevance: string
  level: "Industrial" | "Academic"
  suggestions: string[]
}

export default function StudentProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Project>>({})

  // Evaluation State
  const [evalModalOpen, setEvalModalOpen] = useState(false)
  const [evalProject, setEvalProject] = useState<Project | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [evalLoading, setEvalLoading] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const res = await studentAPI.getMyResume()
      if (res.data && res.data.projects) {
        const mapped = res.data.projects.map((p: any, index: number) => ({
          ...p,
          id: p._id || index + 1,
          technologies: typeof p.technologies === 'string' ? p.technologies.split(',').map((t: string) => t.trim()).filter(Boolean) : (p.technologies || [])
        }))
        setProjects(mapped)
      }
    } catch (error) {
      console.error("Failed to load projects", error)
    }
  }

  const saveToBackend = async (newList: Project[]) => {
    setLoading(true)
    try {
      // Remove frontend-only IDs if needed, but keeping them usually fine if backend ignores
      const payload = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        projects: newList.map(({ id, ...rest }) => ({
          ...rest,
          // Backend expects a single string for technologies
          technologies: Array.isArray(rest.technologies) ? rest.technologies.join(", ") : (rest.technologies || "")
        }))
      }
      await studentAPI.saveResume(payload)
      setProjects(newList)
    } catch (error) {
      console.error("Failed to save projects", error)
      alert("Failed to save projects")
    } finally {
      setLoading(false)
    }
  }

  const addNewProject = () => {
    const newId = Date.now()
    const newProject: Project = {
      id: newId,
      title: "",
      description: "",
      technologies: [],
      githubUrl: "",
      liveUrl: "",
      duration: "",
      level: "",
    }
    const newList = [...projects, newProject]
    setProjects(newList)
    startEdit(newProject)
  }

  const startEdit = (project: Project) => {
    setEditingId(project.id)
    setEditForm({ ...project })
  }

  const saveEdit = async (id: number) => {
    const newList = projects.map((p) => (p.id === id ? { ...p, ...editForm } as Project : p))
    await saveToBackend(newList)
    setEditingId(null)
    setEditForm({})
  }

  const deleteProject = async (id: number) => {
    if (confirm("Delete this project?")) {
      const newList = projects.filter((p) => p.id !== id)
      await saveToBackend(newList)
    }
  }

  const openEvaluation = (project: Project) => {
    setEvalProject(project)
    setJobDescription("")
    setEvaluation(null)
    setEvalModalOpen(true)
  }

  const handleEvaluate = async () => {
    if (!evalProject) return
    setEvalLoading(true)
    try {
      const res = await studentAPI.evaluateProject({
        projectTitle: evalProject.title,
        projectDescription: evalProject.description,
        jobDescription: jobDescription || "General Software Engineering Role"
      })

      // Mock result structure if API returns flat structure or different shape
      // Adjust based on actual API response from backend
      setEvaluation({
        score: res.data.qualityScore || 0,
        relevance: res.data.relevance || "No feedback available.",
        level: res.data.level || "Academic",
        suggestions: res.data.suggestions || []
      })
    } catch (error) {
      console.error("Evaluation failed", error)
      alert("Failed to evaluate project. Please try again.")
    } finally {
      setEvalLoading(false)
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
                <Sparkles className="w-7 h-7" />
                <h1 className="text-2xl font-bold">Projects</h1>
                {loading && <Loader2 className="w-5 h-5 animate-spin ml-2" />}
              </div>
              <button
                onClick={addNewProject}
                disabled={loading || editingId !== null}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 transition flex items-center gap-2 font-semibold disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            </div>
          </header>

          <div className="px-8 py-6 space-y-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl border border-white/10 hover:border-white/20 transition"
              >
                {editingId === project.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.title || ""}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Project Title"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 text-lg font-semibold"
                    />
                    <textarea
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Project Description"
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 resize-none"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editForm.technologies?.join(", ") || ""}
                        onChange={(e) => setEditForm({ ...editForm, technologies: e.target.value.split(",").map(t => t.trim()) })}
                        placeholder="Technologies (comma-separated)"
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                      />
                      <select
                        value={editForm.level || ""}
                        onChange={(e) => setEditForm({ ...editForm, level: e.target.value as any })}
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:border-blue-500"
                      >
                        <option value="" disabled className="text-gray-900">Select Project Level (*)</option>
                        <option value="Industrial" className="text-gray-900">Industrial Project</option>
                        <option value="Academic" className="text-gray-900">Academic Project</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="url"
                        value={editForm.githubUrl || ""}
                        onChange={(e) => setEditForm({ ...editForm, githubUrl: e.target.value })}
                        placeholder="GitHub URL"
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="url"
                        value={editForm.liveUrl || ""}
                        onChange={(e) => setEditForm({ ...editForm, liveUrl: e.target.value })}
                        placeholder="Live Demo URL (optional)"
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={editForm.duration || ""}
                      onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                      placeholder="Duration (e.g., Jan 2024 - Mar 2024)"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(project.id)}
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
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-white">{project.title}</h3>
                          {project.level && (
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${project.level === "Industrial"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              }`}>
                              {project.level}
                            </span>
                          )}
                          <button
                            onClick={() => openEvaluation(project)}
                            className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30 flex items-center gap-1 hover:bg-purple-600/30 transition"
                          >
                            <Zap className="w-3 h-3" />
                            Evaluate
                          </button>
                        </div>
                        <p className="text-sm text-white/60 mb-4">{project.duration}</p>
                        <p className="text-white/80 leading-relaxed mb-4">{project.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(project.technologies || []).map((tech, idx) => (
                            tech.trim() && (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium border border-blue-500/30"
                              >
                                {tech.trim()}
                              </span>
                            )
                          ))}
                        </div>
                        <div className="flex gap-4">
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-white/80 hover:text-white transition"
                            >
                              <Github className="w-4 h-4" />
                              <span className="text-sm">View Code</span>
                            </a>
                          )}
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-white/80 hover:text-white transition"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="text-sm">Live Demo</span>
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(project)}
                          className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {projects.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No projects added yet. Click "Add Project" to get started!</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* AI Evaluation Modal */}
      {evalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0b1221] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                Project Evaluation AI
              </h3>
              <button onClick={() => setEvalModalOpen(false)} className="text-white/60 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!evaluation ? (
                <>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Target Job Description (Optional)</label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste a job description here to see how your project aligns with it. Leave empty for general evaluation."
                      rows={6}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleEvaluate}
                      disabled={evalLoading}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
                    >
                      {evalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      {evalLoading ? "Analyzing..." : "Evaluate Project"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center border-4 border-purple-500">
                      <span className="text-2xl font-bold text-white">{evaluation.score}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Project Quality</h4>
                      <p className="text-sm text-white/60">Level: <span className={`font-semibold ${evaluation.level === "Industrial" ? "text-green-400" : "text-yellow-400"}`}>{evaluation.level}</span></p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h5 className="font-semibold text-blue-400 mb-2">Relevance & Feedback</h5>
                    <p className="text-white/80 text-sm leading-relaxed">{evaluation.relevance}</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h5 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Suggestions for Improvement
                    </h5>
                    <ul className="space-y-2">
                      {evaluation.suggestions.length > 0 ? (
                        evaluation.suggestions.map((s, i) => (
                          <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                            {s}
                          </li>
                        ))
                      ) : (
                        <p className="text-white/50 text-sm">No specific suggestions generated.</p>
                      )}
                    </ul>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <button
                      onClick={() => setEvaluation(null)}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                    >
                      Evaluate Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
