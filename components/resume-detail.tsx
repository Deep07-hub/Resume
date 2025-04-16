"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Resume } from "@/types/resume"
import { 
  Calendar, 
  Mail, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Languages, 
  Clock, 
  FileText, 
  Flame, 
  MailIcon, 
  PhoneIcon, 
  File, 
  MapPin, 
  Phone,
  ChevronDown, 
  Check, 
  CheckCircle2, 
  CircleDashed, 
  XCircle 
} from "lucide-react"
import { Experience, Education } from "@/types/resume";
import { toast } from "@/components/ui/use-toast"

interface ResumeDetailProps {
  resume: Resume
  onStatusChange: (id: string, status: string) => void
}

export function ResumeDetail({ resume: initialResume, onStatusChange }: ResumeDetailProps) {
  const [resume, setResume] = useState<Resume>(initialResume);

  // Update local state when prop changes
  useEffect(() => {
    setResume(initialResume);
  }, [initialResume]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-600"
      case "Processing":
        return "bg-yellow-600"
      case "Processed":
        return "bg-green-600"
      case "Reviewed":
        return "bg-amber-600"
      case "Shortlisted":
        return "bg-green-600"
      case "Failed":
        return "bg-red-600"
      case "Rejected":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-900 to-gray-950 p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white truncate">
          {resume.name || "Unnamed Resume"}
        </h2>
        
        <div className="flex items-center gap-2">
          <Badge 
            className={`${getStatusColor(resume.status)} text-white px-3 py-1`}
          >
            {resume.status || "Status unknown"}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
              Change Status <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-800">
              <DropdownMenuItem 
                className="text-green-400 focus:text-green-400 focus:bg-gray-800"
                onClick={() => onStatusChange(resume.id, "Processed")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Processed
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-yellow-400 focus:text-yellow-400 focus:bg-gray-800"
                onClick={() => onStatusChange(resume.id, "Processing")}
              >
                <CircleDashed className="h-4 w-4 mr-2" /> Processing
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-blue-400 focus:text-blue-400 focus:bg-gray-800"
                onClick={() => onStatusChange(resume.id, "New")}
              >
                <FileText className="h-4 w-4 mr-2" /> New
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-amber-400 focus:text-amber-400 focus:bg-gray-800"
                onClick={() => onStatusChange(resume.id, "Reviewed")}
              >
                <Check className="h-4 w-4 mr-2" /> Reviewed
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-green-400 focus:text-green-400 focus:bg-gray-800"
                onClick={() => onStatusChange(resume.id, "Shortlisted")}
              >
                <Flame className="h-4 w-4 mr-2" /> Shortlisted
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-400 focus:text-red-400 focus:bg-gray-800"
                onClick={() => onStatusChange(resume.id, "Failed")}
              >
                <XCircle className="h-4 w-4 mr-2" /> Failed
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-400 focus:text-red-400 focus:bg-gray-800"
                onClick={() => onStatusChange(resume.id, "Rejected")}
              >
                <XCircle className="h-4 w-4 mr-2" /> Rejected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-220px)] w-full" 
          style={{
            msOverflowStyle: 'auto',
            scrollbarWidth: 'auto',
            scrollbarColor: '#9ca3af #1f2937'
          }}
        >
          <div className="p-6 space-y-6 bg-gradient-to-br from-gray-950 to-gray-900">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-white">{resume.name}</h1>
                  <Badge variant="outline" className="bg-gray-800/50 text-blue-300 border-blue-800/30">
                    {resume.experienceLevel || "Experience level not specified"}
                  </Badge>
                </div>
                <h2 className="text-xl text-gray-300 mb-2">{resume.title || "No title specified"}</h2>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <div className="flex items-center text-gray-400 text-sm">
                    <Mail className="h-4 w-4 mr-1.5 text-gray-500" />
                    <span>{resume.email || "Email not available"}</span>
                  </div>
                  
                  {resume.phone && (
                    <>
                      <div className="text-gray-600">•</div>
                      <div className="flex items-center text-gray-400 text-sm">
                        <Phone className="h-4 w-4 mr-1.5 text-gray-500" />
                        <span>{resume.phone}</span>
                      </div>
                    </>
                  )}
                  
                  {resume.location && (
                    <>
                      <div className="text-gray-600">•</div>
                      <div className="flex items-center text-gray-400 text-sm">
                        <MapPin className="h-4 w-4 mr-1.5 text-gray-500" />
                        <span>{resume.location}</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-3">
                  <Badge className="bg-purple-900/30 text-purple-300 border-purple-800/30 flex items-center gap-1.5 px-2.5 py-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Total Experience: {resume.totalExperience || "Not specified"}</span>
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 sm:items-end">
                {resume.pdfPath && (
                  <Link 
                    href={resume.pdfPath} 
                    target="_blank"
                    className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <File className="h-4 w-4" />
                    <span>View Original PDF</span>
                  </Link>
                )}
              </div>
            </div>
            
            <Separator className="bg-gray-800" />
            
            {resume.pdfPath && (
              <div className="mt-2">
                <Link 
                  href={resume.pdfPath} 
                  target="_blank" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800/30 hover:bg-blue-700/50 text-blue-300 rounded-md transition-colors"
                >
                  <File className="h-4 w-4" />
                  View Original PDF
                </Link>
              </div>
            )}
            
            <Separator className="bg-gray-800" />
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-5 w-5 text-orange-400" />
                <h3 className="text-lg font-medium text-white">Skills</h3>
              </div>
              
              {resume.skills && resume.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill, index) => (
                    <Badge 
                      key={index} 
                      className="bg-orange-900/30 text-orange-300 border-orange-800/30"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No skills listed</p>
              )}
            </div>
            
            <Separator className="bg-gray-800" />
            
            {resume.summary && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-medium text-white">Professional Summary</h3>
                  </div>
                  
                  <Card className="bg-gray-900/60 backdrop-blur-sm border-gray-800">
                    <CardContent className="p-4">
                      <p className="text-gray-300 whitespace-pre-line">{resume.summary}</p>
                    </CardContent>
                  </Card>
                </div>
                <Separator className="bg-gray-800" />
              </>
            )}
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-medium text-white">Professional Experience</h3>
              </div>
              
              {resume.experience && resume.experience.length > 0 ? (
                <div className="space-y-4">
                  {resume.experience.map((exp, index) => (
                    <Card key={index} className="bg-gray-900/60 backdrop-blur-sm border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-white text-base">{exp.title || "Position not specified"}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {exp.company || "Company not specified"}
                          {exp.duration && ` • ${exp.duration}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {exp.description ? (
                          <p className="text-gray-300 whitespace-pre-line">{exp.description}</p>
                        ) : (
                          <p className="text-gray-400 italic">No description provided</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No professional experience listed</p>
              )}
            </div>
            
            <Separator className="bg-gray-800" />
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-medium text-white">Education</h3>
              </div>
              
              {resume.educationDetails && resume.educationDetails.length > 0 ? (
                <div className="space-y-4">
                  {resume.educationDetails.map((edu, index) => (
                    <Card key={index} className="bg-gray-900/60 backdrop-blur-sm border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-white text-base">{edu.degree || "Degree not specified"}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {edu.institution || "Institution not specified"}
                          {edu.year && ` • ${edu.year}`}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No education history listed</p>
              )}
            </div>
            
            {resume.certifications && resume.certifications.length > 0 && (
              <>
                <Separator className="bg-gray-800" />
                
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-5 w-5 text-yellow-400" />
                    <h3 className="text-lg font-medium text-white">Certifications</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {resume.certifications.map((cert, index) => (
                      <Card key={index} className="bg-gray-900/60 backdrop-blur-sm border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-base">{cert}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {resume.languages && resume.languages.length > 0 && (
              <>
                <Separator className="bg-gray-800" />
                
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Languages className="h-5 w-5 text-cyan-400" />
                    <h3 className="text-lg font-medium text-white">Languages</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {resume.languages.map((lang, index) => (
                      <Badge 
                        key={index} 
                        className="bg-cyan-900/30 text-cyan-300 border-cyan-800/30 px-3 py-1"
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div className="h-8"></div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
