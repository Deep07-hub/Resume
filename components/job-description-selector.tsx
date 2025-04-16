"use client"

import { useState, useEffect } from "react"
import { JobDescriptionForm } from "@/components/job-description-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

interface JobDescription {
  id: string
  title: string
  description: string
}

interface JobDescriptionSelectorProps {
  onSelect: (jobDescription: JobDescription) => void
}

export function JobDescriptionSelector({ onSelect }: JobDescriptionSelectorProps) {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchJobDescriptions()
  }, [])

  const fetchJobDescriptions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/job-descriptions")
      if (!response.ok) throw new Error("Failed to fetch job descriptions")

      const data = await response.json()
      setJobDescriptions(data)
    } catch (error) {
      console.error("Error fetching job descriptions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch job descriptions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (id: string) => {
    setSelectedId(id)
    const selected = jobDescriptions.find((jd) => jd.id === id)
    if (selected) {
      onSelect(selected)
    }
  }

  const handleCreateJobDescription = async (jobDescription: any) => {
    try {
      const response = await fetch("/api/job-descriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobDescription),
      })

      if (!response.ok) throw new Error("Failed to create job description")

      const newJobDescription = await response.json()
      setJobDescriptions([newJobDescription, ...jobDescriptions])
      setSelectedId(newJobDescription.id)
      onSelect(newJobDescription)

      toast({
        title: "Success",
        description: "Job description created successfully",
      })
    } catch (error) {
      console.error("Error creating job description:", error)
      toast({
        title: "Error",
        description: "Failed to create job description",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-64">
        <Select value={selectedId} onValueChange={handleSelect} disabled={loading}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Select Job Description" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            {jobDescriptions.map((jd) => (
              <SelectItem key={jd.id} value={jd.id}>
                {jd.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <JobDescriptionForm onSubmit={handleCreateJobDescription} />
    </div>
  )
}
