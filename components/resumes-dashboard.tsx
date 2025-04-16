"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useDebounce } from "use-debounce"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DashboardShell from "@/components/dashboard-shell"
import { Input } from "@/components/ui/input"
import { ResumeList } from "@/components/resume-list"
import { ResumeSidebar, FiltersType } from "@/components/resume-sidebar"
import { ResumeDetail } from "@/components/resume-detail"
import { Resume } from "@/types/resume"
import { UploadIcon, AlertTriangle, Trash2, Search } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// Include both named and default export
export function ResumesDashboard() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [jobDescription, setJobDescription] = useState<string>("")
  const [isMatching, setIsMatching] = useState(false)
  const [matchResults, setMatchResults] = useState<{
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    experienceMatch: number;
    educationMatch: number;
    overallAssessment: string;
    recommendations: string[];
  } | null>(null)
  const [filters, setFilters] = useState<FiltersType>({
    skills: [],
    experience: [],
    education: [],
    status: []
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[] | null>(null)

  const fetchResumes = useCallback(async () => {
    setIsLoading(true)
    try {
      // Build query parameters for filters
      const searchParams = new URLSearchParams();
      
      // Add skills filter
      filters.skills.forEach(skill => {
        searchParams.append('skills', skill);
      });
      
      // Add experience filter
      filters.experience.forEach(exp => {
        searchParams.append('experience', exp);
      });
      
      // Add education filter
      filters.education.forEach(edu => {
        searchParams.append('education', edu);
      });
      
      // Add status filter
      filters.status.forEach(status => {
        searchParams.append('status', status);
      });
      
      // Add search query if exists
      if (debouncedSearchQuery) {
        searchParams.append('search', debouncedSearchQuery);
      }
      
      // Build the URL with query parameters
      const url = `/api/resumes${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      console.log("Fetching resumes with URL:", url);
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch resumes")
      }
      const data = await response.json()
      
      const resumesData = Array.isArray(data) ? data : [];
      setResumes(resumesData)
      
      // Update selected resume if needed
      if (resumesData.length > 0) {
        if (!selectedResume || !resumesData.some(r => r.id === selectedResume.id)) {
          setSelectedResume(resumesData[0])
        }
      } else if (selectedResume && resumesData.length === 0) {
        setSelectedResume(null);
      }
    } catch (error) {
      console.error("Error fetching resumes:", error)
      toast.error("Failed to load resumes", {
        description: "Please try again later"
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedResume, filters, debouncedSearchQuery])

  useEffect(() => {
    fetchResumes()
  }, [fetchResumes])
  
  // Re-fetch when filters change
  useEffect(() => {
    fetchResumes();
  }, [filters, debouncedSearchQuery])

  const handleFilterChange = (newFilters: FiltersType) => {
    setFilters(newFilters)
  }

  const updateResumeStatus = async (resumeId: string, status: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update resume status")
      }

      // Update the resumes list and selected resume with the new status
      const updatedResumes = resumes.map((resume) =>
        resume.id === resumeId ? { ...resume, status } : resume
      )
      setResumes(updatedResumes)
      
      if (selectedResume && selectedResume.id === resumeId) {
        setSelectedResume({ ...selectedResume, status })
      }

      toast.success("Resume status updated", {
        description: `Status changed to ${status}`
      })
    } catch (error) {
      console.error("Error updating resume status:", error)
      toast.error("Failed to update status", {
        description: "Please try again later"
      })
    }
  }

  const handleResumeSelect = (resume: Resume) => {
    console.log("Selected resume:", resume.id, resume.name, "with experience:", resume.totalExperience);
    setSelectedResume(resume);
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(
        file => file.type === 'application/pdf' || 
                file.type === 'application/msword' || 
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      
      if (validFiles.length === 0) {
        toast.error("Invalid files", {
          description: "Please upload PDF or DOC/DOCX files only"
        });
        return;
      }
      
      console.log(`Drag and drop: Processing ${validFiles.length} valid files`);
      
      // Store valid files in state
      setFiles(validFiles);
      
      if (fileInputRef.current) {
        // Update the file input for UI consistency
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));
        fileInputRef.current.files = dataTransfer.files;
        
        // Start upload with the valid files
        const formData = new FormData();
        
        validFiles.forEach((file, index) => {
          console.log(`Adding dropped file ${index + 1}:`, file.name, file.type, file.size);
          formData.append("files", file);
        });
        
        // Verify FormData content
        console.log("FormData entries from drop:");
        for (const entry of formData.entries()) {
          console.log("- Entry:", entry[0], entry[1] instanceof File ? `File: ${(entry[1] as File).name}` : entry[1]);
        }
        
        handleUploadFiles(formData);
      }
    }
  }
  
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Store the files in state
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      
      // Create FormData and start upload
      const formData = new FormData();
      
      // Log for debugging
      console.log(`Preparing to upload ${selectedFiles.length} files`);
      
      selectedFiles.forEach((file, index) => {
        console.log(`Adding file ${index + 1}:`, file.name, file.type, file.size);
        formData.append("files", file);
      });
      
      // Verify FormData content
      console.log("FormData entries:");
      for (const entry of formData.entries()) {
        console.log("- Entry:", entry[0], entry[1] instanceof File ? `File: ${(entry[1] as File).name}` : entry[1]);
      }
      
      handleUploadFiles(formData);
    }
  }
  
  const handleUploadForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!files || files.length === 0) {
      toast.error("No files selected. Please select at least one file to upload.");
      return;
    }
    
    console.log(`Form submission: Processing ${files.length} files`);
    
    // Create a new FormData object and append all files
    const formData = new FormData();
    
    Array.from(files).forEach((file, index) => {
      console.log(`Adding form file ${index + 1}:`, file.name, file.type, file.size);
      formData.append("files", file);
    });
    
    // Verify FormData content
    console.log("FormData entries from form:");
    for (const entry of formData.entries()) {
      console.log("- Entry:", entry[0], entry[1] instanceof File ? `File: ${(entry[1] as File).name}` : entry[1]);
    }
    
    // Pass the formData to handleUploadFiles
    handleUploadFiles(formData);
  };
  
  const handleUploadFiles = async (formData?: FormData) => {
    setIsUploading(true);
    
    try {
      // Create a local FormData variable that won't be undefined
      let uploadFormData = formData || new FormData();
      
      // Log the form data content
      console.log("handleUploadFiles: Checking FormData content");
      let hasFiles = false;
      let fileCount = 0;
      
      for (const entry of uploadFormData.entries()) {
        const [key, value] = entry;
        if (value instanceof File) {
          hasFiles = true;
          fileCount++;
          console.log(`- FormData entry: ${key}, File: ${value.name}, type: ${value.type}, size: ${value.size} bytes`);
        } else {
          console.log(`- FormData entry: ${key}, value: ${value}`);
        }
      }
      
      console.log(`FormData contains ${fileCount} files`);
      
      // If FormData is empty and files exist in state, add them
      if (!hasFiles && files && files.length > 0) {
        console.log(`Adding ${files.length} files from state to FormData`);
        Array.from(files).forEach((file, index) => {
          console.log(`- Adding state file ${index + 1}: ${file.name}`);
          uploadFormData.append("files", file);
        });
        
        // Verify again after adding
        fileCount = 0;
        for (const entry of uploadFormData.entries()) {
          if (entry[1] instanceof File) {
            fileCount++;
          }
        }
        console.log(`After adding files from state, FormData now contains ${fileCount} files`);
      }
      
      // Ensure we have files in the FormData
      if (fileCount === 0) {
        console.error("No files in FormData");
        toast.error("No files selected for upload");
        setIsUploading(false);
        return;
      }
      
      console.log("Initiating upload to /api/upload");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });
      
      console.log(`Upload response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        try {
          // Try to parse as JSON
          const errorJson = JSON.parse(errorText);
          toast.error(`Upload failed: ${errorJson.error || response.statusText}`);
        } catch (e) {
          // If not JSON, use as text
          toast.error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      let data;
      try {
        data = await response.json();
        console.log("Upload successful:", data);
      } catch (jsonError) {
        console.error("Error parsing response JSON:", jsonError);
        toast.error("Error processing server response");
        throw new Error("Failed to parse server response");
      }
      
      toast.success("Resume uploaded successfully");
      
      // Refresh resumes after upload
      fetchResumes();
      
      // Reset file input and close modal
      setFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setShowUploadModal(false);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedResume) return
    
    try {
      const response = await fetch(`/api/resumes/${selectedResume.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete resume")
      }

      toast.success("Resume deleted", {
        description: "Resume has been permanently deleted"
      })
      
      // Update the resumes list
      const updatedResumes = resumes.filter((resume) => resume.id !== selectedResume.id)
      setResumes(updatedResumes)
      
      // Select the first resume in the list or set to null if no resumes
      setSelectedResume(updatedResumes.length > 0 ? updatedResumes[0] : null)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Error deleting resume:", error)
      toast.error("Failed to delete resume", {
        description: "Please try again later"
      })
    }
  }

  // Add a function to handle job matching
  const handleMatchResume = async () => {
    if (!selectedResume || !jobDescription.trim()) return;
    
    setIsMatching(true);
    setMatchResults(null);
    
    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeId: selectedResume.id,
          jobDescription,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to match resume");
      }
      
      const data = await response.json();
      setMatchResults(data);
      
      toast.success("Resume matched successfully", {
        description: `Match score: ${data.matchScore}%`
      });
    } catch (error) {
      console.error("Error matching resume:", error);
      toast.error("Failed to match resume", {
        description: "Please try again later"
      });
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <DashboardShell>
      <div className="w-full h-full flex flex-col relative">
        <div className="flex h-full bg-gradient-to-br from-gray-950 to-gray-900">
          <ResumeSidebar filters={filters} onFilterChange={handleFilterChange} />
          
          <div className="flex-1 flex">
            <div className="w-1/4 border-r border-gray-800 overflow-hidden">
              <ResumeList
                resumes={resumes}
                selectedResumeId={selectedResume?.id}
                onSelectResume={handleResumeSelect}
              />
          </div>
            
            <div className="w-3/4 flex flex-col">
              {selectedResume ? (
                <div className="flex flex-col h-full">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <div className="border-b border-gray-800 px-6 py-3 bg-gray-900 sticky top-0 z-10">
                      <TabsList className="bg-gray-800 p-1">
                    <TabsTrigger
                      value="details"
                          className="data-[state=active]:bg-[#0099ff] data-[state=active]:text-white rounded-md transition-all duration-200"
                    >
                      Resume Details
                    </TabsTrigger>
                    <TabsTrigger
                          value="matching"
                          className="data-[state=active]:bg-[#0099ff] data-[state=active]:text-white rounded-md transition-all duration-200"
                        >
                          Job Matching
                        </TabsTrigger>
                        <TabsTrigger 
                          value="delete"
                          className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-md transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </div>
                    
                    <TabsContent value="details" className="flex-1 p-0 m-0 h-full">
                  <ResumeDetail
                    resume={selectedResume}
                    onStatusChange={updateResumeStatus}
                  />
                </TabsContent>
                    
                    <TabsContent value="matching" className="flex-1 p-0 m-0 overflow-auto">
                      <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-gray-900">
                        <div className="bg-gradient-to-r from-gray-900 to-gray-950 p-4 border-b border-gray-800 sticky top-0 z-10">
                          <h3 className="text-lg font-medium text-white mb-2">Match Against Job Description</h3>
                          <div className="flex flex-col">
                            <textarea
                              placeholder="Paste job description here to match with this resume..."
                              value={jobDescription}
                              onChange={(e) => setJobDescription(e.target.value)}
                              className="w-full h-32 px-3 py-2 rounded-md bg-gray-800 border border-gray-700 focus:border-[#0099ff] focus:ring-[#0099ff] text-white resize-none"
                            />
                            <Button
                              className="mt-2 bg-gradient-to-r from-[#0066cc] to-[#0099ff] hover:from-[#0055bb] hover:to-[#0088ee] text-white shadow-md shadow-blue-900/20 w-full"
                              disabled={!jobDescription.trim() || isMatching}
                              onClick={handleMatchResume}
                            >
                              {isMatching ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Matching...
                                </>
                              ) : (
                                "Match Resume"
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-auto">
                          {matchResults ? (
                            <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-white">Match Results</h3>
                                <div className="relative h-24 w-24">
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-white">{matchResults.matchScore}%</span>
                                  </div>
                                  <svg className="transform -rotate-90" width="96" height="96" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="#1f2937" strokeWidth="12" />
                                    <circle 
                                      cx="60" 
                                      cy="60" 
                                      r="54" 
                                      fill="none" 
                                      stroke={
                                        matchResults.matchScore >= 75 ? "#22c55e" : 
                                        matchResults.matchScore >= 50 ? "#eab308" :
                                        matchResults.matchScore >= 25 ? "#f97316" : "#ef4444"
                                      } 
                                      strokeWidth="12" 
                                      strokeDasharray="339.292" 
                                      strokeDashoffset={339.292 * (1 - matchResults.matchScore / 100)} 
                                    />
                                  </svg>
                                </div>
                              </div>

                              <div className="p-4 rounded-lg border border-blue-900/40 bg-blue-900/10">
                                <p className="text-white">{matchResults.overallAssessment}</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800">
                                  <h4 className="text-lg font-medium text-white mb-3">Skills Match</h4>
                                  <div className="flex mb-2 items-center">
                                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                                      <div 
                                        className="bg-blue-600 h-2.5 rounded-full" 
                                        style={{ width: `${matchResults.matchScore}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm text-gray-400 ml-2">{matchResults.matchScore}%</span>
                                  </div>
                                  
                                  {matchResults.matchedSkills.length > 0 && (
                                    <div className="mb-4">
                                      <h5 className="text-sm font-medium text-gray-300 mb-2">Matched Skills</h5>
                                      <div className="flex flex-wrap gap-2">
                                        {matchResults.matchedSkills.map((skill, index) => (
                                          <span key={index} className="px-2.5 py-1 rounded-full text-xs bg-green-900/30 text-green-300 border border-green-800/30">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {matchResults.missingSkills.length > 0 && (
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-300 mb-2">Missing Skills</h5>
                                      <div className="flex flex-wrap gap-2">
                                        {matchResults.missingSkills.map((skill, index) => (
                                          <span key={index} className="px-2.5 py-1 rounded-full text-xs bg-red-900/30 text-red-300 border border-red-800/30">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800">
                                  <h4 className="text-lg font-medium text-white mb-3">Experience & Education</h4>
                                  
                                  <div className="mb-4">
                                    <div className="flex justify-between mb-1">
                                      <span className="text-sm text-gray-300">Experience Match</span>
                                      <span className="text-sm text-gray-400">{matchResults.experienceMatch}%</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                                      <div 
                                        className="bg-purple-600 h-2.5 rounded-full" 
                                        style={{ width: `${matchResults.experienceMatch}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="flex justify-between mb-1">
                                      <span className="text-sm text-gray-300">Education Match</span>
                                      <span className="text-sm text-gray-400">{matchResults.educationMatch}%</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                                      <div 
                                        className="bg-amber-600 h-2.5 rounded-full" 
                                        style={{ width: `${matchResults.educationMatch}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {matchResults.recommendations.length > 0 && (
                                <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800">
                                  <h4 className="text-lg font-medium text-white mb-3">Recommendations</h4>
                                  <ul className="space-y-2">
                                    {matchResults.recommendations.map((recommendation, index) => (
                                      <li key={index} className="flex items-start">
                                        <span className="inline-block w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center mr-2 mt-0.5 text-xs font-bold">{index + 1}</span>
                                        <span className="text-gray-300">{recommendation}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center text-center">
                              <div className="max-w-md">
                                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-white mb-2">No Match Results Yet</h3>
                                <p className="text-gray-400">
                                  Paste a job description above and click "Match Resume" to see how well this candidate matches the requirements.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="delete" className="flex-1 p-0 m-0 overflow-auto">
                      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900">
                        <div className="max-w-md p-6 rounded-lg border border-red-900/50 bg-red-950/20">
                          <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
                          <h3 className="text-xl font-medium text-white text-center mb-4">Delete This Resume?</h3>
                          <p className="text-gray-400 text-center mb-6">
                            Are you sure you want to delete this resume? This action cannot be undone and all data associated with this resume will be permanently removed.
                          </p>
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => setShowDeleteDialog(true)}
                          >
                            Delete Resume
                          </Button>
                        </div>
                      </div>
                </TabsContent>
              </Tabs>
            </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <UploadIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No Resume Selected</h3>
                    <p className="text-gray-400 mb-6 max-w-md">
                      Please select a resume from the list or upload a new one to view details.
                    </p>
                    <Button 
                      onClick={() => setShowUploadModal(true)}
                      className="bg-gradient-to-r from-[#0088ee] to-[#0099ff] hover:from-[#0077dd] hover:to-[#0088ee] text-white shadow-md shadow-blue-900/20"
                    >
                      <UploadIcon className="mr-2 h-4 w-4" />
                      Upload Resume
                    </Button>
                  </div>
            </div>
          )}
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="bg-gradient-to-br from-gray-950 to-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-medium">Upload Resumes</DialogTitle>
              <DialogDescription className="text-gray-400">
                Drag and drop files or click to browse
              </DialogDescription>
            </DialogHeader>
            <div 
              className={`border-2 border-dashed ${dragActive ? 'border-[#0099ff] bg-[#0099ff]/10' : 'border-gray-700'} rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-[#0099ff] transition-colors`}
              onClick={handleBrowseClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <>
                  <div className="w-12 h-12 rounded-full border-4 border-t-[#0099ff] border-r-[#0099ff]/50 border-b-[#0099ff]/30 border-l-transparent animate-spin mb-4"></div>
                  <p className="text-[#0099ff] text-center font-medium">
                    Uploading and processing your files...
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    This may take a minute depending on file size
                  </p>
                </>
              ) : (
                <>
                  <UploadIcon className={`h-12 w-12 ${dragActive ? 'text-[#0099ff]' : 'text-gray-600'} mb-4 transition-colors`} />
                  <p className={`${dragActive ? 'text-[#0099ff]' : 'text-gray-400'} text-center transition-colors`}>
                    {dragActive ? 'Drop your files here' : 'Drag and drop your resumes here, or click to browse'}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Supports PDF, DOC, DOCX
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                id="file-upload"
                name="files"
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                className="mr-2 border-gray-700 text-gray-300 hover:bg-gray-800"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-gradient-to-r from-[#0066cc] to-[#0099ff] hover:from-[#0055bb] hover:to-[#0088ee] text-white shadow-md shadow-blue-900/20"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Browse Files
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-gradient-to-br from-gray-950 to-gray-900 border-gray-800 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-medium">Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This action cannot be undone. This will permanently delete this resume and remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Floating upload button - positioned outside the main container but inside the Dashboard shell */}
        <Button 
          onClick={() => setShowUploadModal(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-[#0066cc] to-[#0099ff] hover:from-[#0055bb] hover:to-[#0088ee] text-white shadow-lg z-50 w-auto h-auto py-3 px-4 rounded-full"
        >
          <UploadIcon className="mr-2 h-5 w-5" />
          Upload Resume
        </Button>
      </div>
    </DashboardShell>
  )
}

// Also add a default export for backward compatibility
export default ResumesDashboard; 