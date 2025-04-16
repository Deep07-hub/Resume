"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Upload, FileText, CheckCircle, AlertTriangle, X } from "lucide-react"

interface ResumeUploadModalProps {
  onUpload: (files: File[]) => Promise<void>
}

export function ResumeUploadModal({ onUpload }: ResumeUploadModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      // Filter to only accept PDF, DOC, DOCX files
      const validFiles = files.filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        return ['pdf', 'doc', 'docx'].includes(ext)
      })
      
      if (validFiles.length !== files.length) {
        toast({
          title: "Invalid file type",
          description: "Only PDF, DOC, and DOCX files are supported",
          variant: "destructive",
        })
      }
      
      setSelectedFiles(prev => [...prev, ...validFiles])
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      setSelectedFiles(prev => [...prev, ...files])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one resume to upload",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Starting upload process for", selectedFiles.length, "files")
      setIsUploading(true)
      setUploadProgress(10) // Initial progress
      
      // Simulate progress updates during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Cap progress at 90% until we get actual confirmation
          return Math.min(prev + 5, 90)
        })
      }, 500)
      
      try {
        await onUpload(selectedFiles)
        console.log("Upload process completed successfully")
        
        // Set to 100% when complete
        clearInterval(progressInterval)
        setUploadProgress(100)
        
        // Small delay to show 100% completion before closing
        setTimeout(() => {
          setIsOpen(false)
          setSelectedFiles([])
          setUploadProgress(0)
        }, 500)
        
        toast({
          title: "Upload successful",
          description: `Successfully uploaded ${selectedFiles.length} resume(s)`,
          variant: "default",
        })
      } catch (uploadError) {
        clearInterval(progressInterval)
        setUploadProgress(0)
        console.error("Error from onUpload:", uploadError)
        throw uploadError
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      let errorMessage = "Failed to upload resumes. Please try again."
      
      if (error instanceof Error) {
        errorMessage = error.message
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-[#0099ff] hover:bg-[#0088ee] flex items-center gap-2">
          <Upload size={16} />
          <span>Upload Resume</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Upload Resumes</DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload resumes in PDF, DOC, or DOCX format. Files will be processed and parsed automatically.
          </DialogDescription>
        </DialogHeader>
        
        {!isUploading ? (
          <>
            <div 
              className={`mt-4 border-2 border-dashed p-6 rounded-lg transition-colors ${dragActive ? 'border-[#0099ff] bg-blue-50 dark:bg-slate-800/50' : 'border-gray-300 dark:border-gray-700'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-2 text-center">
                <FileText size={40} className="text-[#0099ff]" />
                <div className="text-lg font-medium">Drag & drop files here</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse for files
                </p>
                <Label 
                  htmlFor="resume-upload" 
                  className="mt-2 bg-[#0099ff] text-white py-2 px-4 rounded-md cursor-pointer hover:bg-[#0088ee] transition-colors"
                >
                  Browse Files
                </Label>
                <Input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Selected files ({selectedFiles.length}):</div>
                <div className="max-h-[150px] overflow-y-auto pr-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 mb-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <div className="flex items-center">
                        <FileText size={18} className="mr-2 text-gray-500" />
                        <div className="truncate max-w-[350px]">{file.name}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => removeFile(index)}
                      >
                        <X size={16} className="text-gray-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 mb-4">
            <div className="text-center mb-4">
              <div className="mb-2 text-lg font-medium">Uploading {selectedFiles.length} file(s)</div>
              <p className="text-sm text-gray-500">Please wait while your files are being uploaded and processed...</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
              <div 
                className="bg-[#0099ff] h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="text-right text-sm text-gray-500">{uploadProgress}%</div>
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="bg-[#0099ff] hover:bg-[#0088ee] ml-2"
          >
            {isUploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                Uploading...
              </>
            ) : (
              "Upload Files"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
