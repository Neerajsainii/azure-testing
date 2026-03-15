"use client"

import { useState, useEffect } from "react"
import { BookOpen, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import StudentSidebar from "@/components/student-sidebar"
import { studentAPI } from "@/lib/api"

export default function StudentATSPage() {
  const [score, setScore] = useState<number | null>(null)
  const [jobMatchScore, setJobMatchScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastScoredAt, setLastScoredAt] = useState<string | null>(null)
  const [extractedSkills, setExtractedSkills] = useState<string[]>([])
  const [missingSkills, setMissingSkills] = useState<string[]>([])
  const [calibrationReasons, setCalibrationReasons] = useState<{
    atsScoreReason: string
    jobMatchReason: string
    topStrengths: string[]
    improvementAreas: string[]
    suggestedSkills: string[]
  }>({
    atsScoreReason: "",
    jobMatchReason: "",
    topStrengths: [],
    improvementAreas: [],
    suggestedSkills: [],
  })

  useEffect(() => {
    fetchScore()
  }, [])

  const fetchScore = async () => {
    try {
      const res = await studentAPI.getATSScore()
      setScore(res.data.atsScore)
      setJobMatchScore(res.data.jobMatchScore || 0)
      setLastScoredAt(res.data.lastAIScoredAt)
      // Map 'skills' from backend to 'extractedSkills' in frontend
      setExtractedSkills(res.data.skills || res.data.extractedSkills || [])
      setMissingSkills(res.data.missingSkills || [])
      setCalibrationReasons({
        atsScoreReason: res.data.calibrationReasons?.atsScoreReason || "",
        jobMatchReason: res.data.calibrationReasons?.jobMatchReason || "",
        topStrengths: res.data.calibrationReasons?.topStrengths || [],
        improvementAreas: res.data.calibrationReasons?.improvementAreas || [],
        suggestedSkills: res.data.calibrationReasons?.suggestedSkills || [],
      })
    } catch (error) {
      console.error("Failed to fetch ATS score", error)
    }
  }

  const handleCalculateScore = async () => {
    setLoading(true)
    try {
      const res = await studentAPI.calculateATSScore()
      setScore(res.data.atsScore)
      setJobMatchScore(res.data.jobMatchScore || 0)
      setLastScoredAt(new Date().toISOString())
      // Map 'skills' from backend to 'extractedSkills' in frontend
      setExtractedSkills(res.data.skills || res.data.extractedSkills || [])
      setMissingSkills(res.data.missingSkills || [])
      setCalibrationReasons({
        atsScoreReason: res.data.calibrationReasons?.atsScoreReason || "",
        jobMatchReason: res.data.calibrationReasons?.jobMatchReason || "",
        topStrengths: res.data.calibrationReasons?.topStrengths || [],
        improvementAreas: res.data.calibrationReasons?.improvementAreas || [],
        suggestedSkills: res.data.calibrationReasons?.suggestedSkills || [],
      })
    } catch (error: any) {
      console.error("Failed to calculate ATS score", error)
      alert(error.response?.data?.message || "AI service is temporarily unavailable, please try again later.")
    } finally {
      setLoading(false)
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
              <BookOpen className="w-7 h-7" />
              <h1 className="text-2xl font-bold">ATS Score Checker</h1>
            </div>
          </header>

          <div className="px-8 py-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Check Your ATS Score</h2>
              <p className="text-white/80 mb-6">
                Calculate your resume's ATS score based on your profile information.
              </p>

              <div className="flex flex-col items-center justify-center py-8">
                <button
                  onClick={handleCalculateScore}
                  disabled={loading}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold text-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing Profile...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Calculate Score
                    </>
                  )}
                </button>

                {lastScoredAt && (
                  <p className="text-white/40 mt-4 text-sm">
                    Last checked: {new Date(lastScoredAt).toLocaleDateString()} {new Date(lastScoredAt).toLocaleTimeString()}
                  </p>
                )}
              </div>

              {score !== null && (
                <div className="mt-8 space-y-6">
                  <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
                    {/* ATS Score Gauge */}
                    <div className="text-center">
                      <div className="inline-block relative">
                        <svg className="w-48 h-48 transform -rotate-90">
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            className="text-white/10"
                          />
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 88}`}
                            strokeDashoffset={`${2 * Math.PI * 88 * (1 - score / 100)}`}
                            className={score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500"}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-6xl font-bold text-white">{score}</div>
                          <div className="text-white/60">ATS Score</div>
                        </div>
                      </div>
                    </div>

                    {/* Job Match Score Gauge */}
                    <div className="text-center">
                      <div className="inline-block relative">
                        <svg className="w-48 h-48 transform -rotate-90">
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            className="text-white/10"
                          />
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 88}`}
                            strokeDashoffset={`${2 * Math.PI * 88 * (1 - (jobMatchScore || 0) / 100)}`}
                            className={(jobMatchScore || 0) >= 80 ? "text-blue-500" : (jobMatchScore || 0) >= 60 ? "text-purple-500" : "text-gray-500"}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-6xl font-bold text-white">{jobMatchScore || 0}</div>
                          <div className="text-white/60">Job Match</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">Extracted Skills</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {extractedSkills.length > 0 ? (
                          extractedSkills.map((skill, index) => (
                            <span key={index} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-white/50 text-sm">No skills extracted yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <h3 className="text-lg font-semibold text-white">Missing Skills</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {missingSkills.length > 0 ? (
                          missingSkills.map((skill, index) => (
                            <span key={index} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-white/50 text-sm">No critical skills missing!</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Why These Scores</h3>
                    <p className="text-white/80 text-sm mb-3">
                      {calibrationReasons.atsScoreReason || "ATS reason not available yet."}
                    </p>
                    <p className="text-white/80 text-sm mb-4">
                      {calibrationReasons.jobMatchReason || "Job match reason not available yet."}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-white/60 text-xs mb-2">Top Strengths</p>
                        <div className="flex flex-wrap gap-2">
                          {calibrationReasons.topStrengths.length > 0 ? (
                            calibrationReasons.topStrengths.map((item, index) => (
                              <span key={index} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                                {item}
                              </span>
                            ))
                          ) : (
                            <p className="text-white/40 text-xs">No strengths generated yet.</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs mb-2">Improvement Areas</p>
                        <div className="flex flex-wrap gap-2">
                          {calibrationReasons.improvementAreas.length > 0 ? (
                            calibrationReasons.improvementAreas.map((item, index) => (
                              <span key={index} className="px-3 py-1 bg-yellow-500/20 text-yellow-200 rounded-full text-xs">
                                {item}
                              </span>
                            ))
                          ) : (
                            <p className="text-white/40 text-xs">No improvement areas generated yet.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {calibrationReasons.suggestedSkills.length > 0 && (
                      <div className="mt-6 border-t border-white/10 pt-4">
                        <p className="text-white/60 text-xs mb-2 font-medium">Suggested Skills to Add</p>
                        <p className="text-white/40 text-xs mb-3">Adding these skills to your resume might improve your ATS score.</p>
                        <div className="flex flex-wrap gap-2">
                          {calibrationReasons.suggestedSkills.map((item, index) => (
                            <span key={index} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs border border-indigo-500/30">
                              + {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
