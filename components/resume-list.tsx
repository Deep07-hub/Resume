"use client"

import type { Resume } from "@/types/resume"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect } from "react"
import { CalendarDays, Clock, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ResumeListProps {
  resumes: Resume[]
  selectedResumeId: string | undefined
  onSelectResume: (resume: Resume) => void
}

export function ResumeList({ resumes = [], selectedResumeId, onSelectResume }: ResumeListProps) {
  // Add a debug effect that logs when resumes change
  useEffect(() => {
    console.log(`ResumeList component received ${resumes?.length || 0} resumes`);
    if (resumes?.length > 0) {
      console.log(`First resume:`, {
        id: resumes[0].id,
        name: resumes[0].name,
        status: resumes[0].status,
        skills: resumes[0].skills?.length > 0 ? resumes[0].skills[0] + '...' : 'none'
      });
    }
  }, [resumes]);

  // Ensure resumes is always an array
  const resumesList = Array.isArray(resumes) ? resumes : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-gradient-to-r from-blue-800 to-blue-600 text-blue-100 border-blue-700 shadow-blue-900/30"
      case "Reviewed":
        return "bg-gradient-to-r from-purple-800 to-purple-600 text-purple-100 border-purple-700 shadow-purple-900/30"
      case "Shortlisted":
        return "bg-gradient-to-r from-green-800 to-green-600 text-green-100 border-green-700 shadow-green-900/30" 
      case "Rejected":
        return "bg-gradient-to-r from-red-800 to-red-600 text-red-100 border-red-700 shadow-red-900/30"
      default:
        return "bg-gradient-to-r from-gray-800 to-gray-700 text-gray-300 border-gray-700 shadow-gray-900/30"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "Unknown date";
    }
  }

  return (
    <div className="w-80 border-r border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950">
      <div className="p-4 border-b border-gray-800/50 bg-gray-900/60 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#0099ff]" />
          Resumes <span className="text-sm font-normal text-gray-400 ml-1">({resumesList.length})</span>
        </h2>
      </div>
      <ScrollArea className="h-[calc(100vh-8rem)] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="divide-y divide-gray-800/30">
          {resumesList.length > 0 ? (
            resumesList.map((resume, index) => (
              <div
                key={resume.id}
                className={`p-4 cursor-pointer hover:bg-gray-800/40 transition-all duration-200 group ${
                  selectedResumeId === resume.id ? "bg-gray-800/80 border-l-4 border-[#0099ff]" : "border-l-4 border-transparent"
                }`}
                onClick={() => onSelectResume(resume)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-white group-hover:text-[#0099ff] transition-colors">
                    {resume.name || resume.originalName}
                  </h3>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(resume.status)} shadow-md transition-all duration-300 group-hover:scale-105 text-xs font-medium py-0.5`}
                  >
                    {resume.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-2 line-clamp-1 group-hover:text-gray-300 transition-colors">
                  {resume.title || "No title"}
                </p>
                
                <div className="flex items-center text-xs text-gray-500 mb-3 group-hover:text-gray-400 transition-colors">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatDate(resume.uploadedAt)}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {resume.skills?.slice(0, 3).map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-gray-800/80 text-gray-300 hover:bg-gray-700 border-gray-700/50 text-xs py-0 px-2 transition-colors"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {resume.skills?.length > 3 && (
                    <Badge 
                      variant="secondary" 
                      className="bg-gray-800/80 text-gray-300 hover:bg-gray-700 border-gray-700/50 text-xs py-0 px-2"
                    >
                      +{resume.skills.length - 3}
                    </Badge>
                  )}
                  {(!resume.skills || resume.skills.length === 0) && (
                    <span className="text-xs text-gray-500 italic">No skills listed</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 h-40">
              <FileText className="h-8 w-8 text-gray-600 mb-2" />
              <p>No resumes match your filters</p>
              <p className="text-sm text-gray-500 mt-1">Try changing your filters</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
