"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { DownloadCloud, FileDown, Loader2 } from "lucide-react"
import StudentSidebar from "@/components/student-sidebar"
import { studentAPI } from "@/lib/api"

export default function StudentDownloadPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const templateParam = searchParams.get("template")
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    init()
  }, [templateParam])

  const init = async () => {
    setLoading(true)
    try {
      if (templateParam) {
        await studentAPI.selectTemplate(templateParam)
      }
      
      const res = await studentAPI.previewResume()
      setPreviewHtml(res.data.html)
    } catch (error: any) {
      console.error("Failed to load preview", error)
      if (error.response?.status === 400 || error.response?.status === 404) {
          // If template not selected or resume not found, redirect to templates or dashboard
          // But maybe user just hasn't created resume yet?
          // For now, let's assume they might need to select a template
          if (!templateParam) {
             navigate("/student/templates")
          }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await studentAPI.downloadResume()
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'resume.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Failed to download", error)
    } finally {
      setDownloading(false)
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
              <DownloadCloud className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Preview & Download</h1>
            </div>
          </header>

          <div className="px-8 py-6">
            <div className="flex justify-between items-center mb-6">
                <button 
                    onClick={() => navigate("/student/templates")}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                >
                    Change Template
                </button>
                <button
                    onClick={handleDownload}
                    disabled={downloading || loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold flex items-center gap-2 disabled:opacity-50"
                >
                    {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                    Download PDF
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-xl overflow-hidden min-h-[600px] flex items-center justify-center">
                {loading ? (
                    <div className="text-gray-500 flex flex-col items-center">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p>Generating Preview...</p>
                    </div>
                ) : previewHtml ? (
                    <iframe
                        title="Resume Preview"
                        sandbox=""
                        srcDoc={previewHtml}
                        className="w-full min-h-[600px] border-0 bg-white"
                    />
                ) : (
                    <div className="text-gray-500">No preview available</div>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
