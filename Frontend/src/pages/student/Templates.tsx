"use client"

import { FileText } from "lucide-react"
import StudentSidebar from "@/components/student-sidebar"
import { useNavigate } from "react-router-dom"
import { studentAPI } from "@/lib/api"

interface Template {
  id: number
  name: string
  preview: string
  key: string
  badge?: string
  description: string
}

const templates: Template[] = [
  {
    id: 1,
    name: "Professional Standard",
    preview: "/image/STON.png",
    key: "template1",
    badge: "ATS Friendly",
    description: "Classic Times New Roman layout. Best for traditional corporate roles."
  },
  {
    id: 2,
    name: "Modern Clean",
    preview: "/image/STON.png",
    key: "template2",
    badge: "Popular",
    description: "Clean Arial design with clear hierarchy. Great for tech and startups."
  },
  {
    id: 3,
    name: "Classic Blue",
    preview: "/image/STON.png",
    key: "classic",
    description: "Original blue accent design."
  },
]

export default function StudentTemplatesPage() {
  const navigate = useNavigate()

  const handleSelectTemplate = async (templateKey: string) => {
    try {
      await studentAPI.selectTemplate(templateKey)
      navigate(`/student/download?template=${templateKey}`)
    } catch (error) {
      console.error("Failed to select template", error)
      // Still navigate so they can see preview/download page which might handle it
      navigate(`/student/download?template=${templateKey}`)
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
            <div className="flex items-center gap-3 text-white">
              <FileText className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Resume Templates</h1>
            </div>
          </header>

          <div className="px-8 py-6">
            <div className="grid grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition shadow-xl cursor-pointer"
                  onClick={() => handleSelectTemplate(template.key)}
                >
                  <div className="relative h-64 bg-white/5 flex items-center justify-center">
                    <img src={template.preview} alt={template.name} className="w-32 h-32 object-contain opacity-50" />
                    {template.badge && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                        {template.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
                    <p className="text-xs text-white/60 mb-3 line-clamp-2">{template.description}</p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
