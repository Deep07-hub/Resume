"use client"

import { useState } from "react"
import type { Resume } from "@/types/resume"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { JobDescriptionSelector } from "@/components/job-description-selector"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface ResumeMatchViewProps {
  resume: Resume
  onStatusChange: (status: string) => void
}

interface JobDescription {
  id: string
  title: string
  description: string
}

interface MatchResult {
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  experienceMatch: number
  educationMatch: number
  overallAssessment: string
  recommendations: string[]
}

export function ResumeMatchView({ resume, onStatusChange }: ResumeMatchViewProps) {
  const [selectedJD, setSelectedJD] = useState<JobDescription | null>(null)
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSelectJD = (jobDescription: JobDescription) => {
    setSelectedJD(jobDescription)
    setMatchResult(null)
  }

  const handleMatch = async () => {
    if (!selectedJD) return

    try {
      setLoading(true)

      const response = await fetch("/api/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeId: resume.id,
          jobDescription: selectedJD.description,
        }),
      })

      if (!response.ok) throw new Error("Failed to match resume")

      const data = await response.json()
      
      if (data.success && data.matchResults) {
        const result = data.matchResults;
        
        const processedResult: MatchResult = {
          matchScore: result.overallMatch,
          matchedSkills: result.skillsMatch.matchedSkills,
          missingSkills: result.skillsMatch.missingSkills,
          experienceMatch: result.experienceMatch,
          educationMatch: result.educationMatch,
          overallAssessment: result.overallAssessment,
          recommendations: result.recommendations
        };
        
        setMatchResult(processedResult);
        
        toast({
          title: "Match Complete",
          description: `Match score: ${processedResult.matchScore}%`,
        });
      } else {
        throw new Error("Invalid response from match API");
      }
    } catch (error) {
      console.error("Error matching resume:", error)
      toast({
        title: "Error",
        description: "Failed to match resume against job description",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="flex-1 bg-gray-900 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">Match Resume</h1>
            <p className="text-gray-400">Match {resume.name}'s resume against a job description</p>
          </div>
        </div>

        <div className="mt-6">
          <JobDescriptionSelector onSelect={handleSelectJD} />
        </div>

        {selectedJD && (
          <div className="mt-4 p-4 bg-gray-800 rounded-md">
            <h2 className="text-lg font-semibold text-white">{selectedJD.title}</h2>
            <p className="text-gray-400 mt-2 line-clamp-3">{selectedJD.description}</p>
            <Button
              onClick={handleMatch}
              disabled={loading}
              className="mt-4 bg-[#0099ff] hover:bg-[#0077cc] text-white"
            >
              {loading ? "Matching..." : "Match Resume"}
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-6">
        {matchResult ? (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Match Results</h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-400">Overall Match</h3>
                  <div className="flex items-center mt-2">
                    <span className={`text-2xl font-bold ${getScoreColor(matchResult.matchScore)}`}>
                      {matchResult.matchScore}%
                    </span>
                  </div>
                  <Progress
                    value={matchResult.matchScore}
                    className="h-2 mt-2 bg-gray-700"
                    indicatorClassName={getProgressColor(matchResult.matchScore)}
                  />
                </div>

                <div className="bg-gray-800 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-400">Experience Match</h3>
                  <div className="flex items-center mt-2">
                    <span className={`text-2xl font-bold ${getScoreColor(matchResult.experienceMatch)}`}>
                      {matchResult.experienceMatch}%
                    </span>
                  </div>
                  <Progress
                    value={matchResult.experienceMatch}
                    className="h-2 mt-2 bg-gray-700"
                    indicatorClassName={getProgressColor(matchResult.experienceMatch)}
                  />
                </div>

                <div className="bg-gray-800 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-400">Education Match</h3>
                  <div className="flex items-center mt-2">
                    <span className={`text-2xl font-bold ${getScoreColor(matchResult.educationMatch)}`}>
                      {matchResult.educationMatch}%
                    </span>
                  </div>
                  <Progress
                    value={matchResult.educationMatch}
                    className="h-2 mt-2 bg-gray-700"
                    indicatorClassName={getProgressColor(matchResult.educationMatch)}
                  />
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-md mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Overall Assessment</h3>
                <p className="text-white">{matchResult.overallAssessment}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                    Matched Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.matchedSkills.length > 0 ? (
                      matchResult.matchedSkills.map((skill) => (
                        <Badge key={skill} className="bg-green-900 text-green-300 border-green-700">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500">No matched skills found</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                    <XCircle className="h-4 w-4 text-red-500 mr-1" />
                    Missing Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.missingSkills.length > 0 ? (
                      matchResult.missingSkills.map((skill) => (
                        <Badge key={skill} className="bg-red-900 text-red-300 border-red-700">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500">No missing skills found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            <div>
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 text-[#0099ff] mr-2" />
                Recommendations
              </h2>
              <ul className="space-y-2">
                {matchResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="bg-gray-800 p-3 rounded-md text-gray-300">
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex justify-end">
              {matchResult.matchScore >= 80 && (
                <Button
                  onClick={() => onStatusChange("Shortlisted")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Shortlist Candidate
                </Button>
              )}
              {matchResult.matchScore >= 60 && matchResult.matchScore < 80 && (
                <Button
                  onClick={() => onStatusChange("Reviewed")}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Mark as Reviewed
                </Button>
              )}
              {matchResult.matchScore < 60 && (
                <Button onClick={() => onStatusChange("Rejected")} className="bg-red-600 hover:bg-red-700 text-white">
                  Reject Candidate
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gray-800 p-8 rounded-lg max-w-md">
              <AlertCircle className="h-12 w-12 text-[#0099ff] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No Match Results</h2>
              <p className="text-gray-400">
                Select a job description and click "Match Resume" to see how well this candidate matches the
                requirements.
              </p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
