"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function JobDescriptionForm({ onSubmit }: { onSubmit: (jobDescription: any) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [preferredSkills, setPreferredSkills] = useState<string[]>([])
  const [experienceLevel, setExperienceLevel] = useState("Mid Level")
  const [educationRequirements, setEducationRequirements] = useState<string[]>([])
  const [department, setDepartment] = useState("")
  const [location, setLocation] = useState("")

  const [newRequiredSkill, setNewRequiredSkill] = useState("")
  const [newPreferredSkill, setNewPreferredSkill] = useState("")
  const [newEducationRequirement, setNewEducationRequirement] = useState("")

  const handleSubmit = () => {
    if (!title || !description) return

    const jobDescription = {
      title,
      description,
      requiredSkills,
      preferredSkills,
      experienceLevel,
      educationRequirements,
      department,
      location,
    }

    onSubmit(jobDescription)
    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setRequiredSkills([])
    setPreferredSkills([])
    setExperienceLevel("Mid Level")
    setEducationRequirements([])
    setDepartment("")
    setLocation("")
    setNewRequiredSkill("")
    setNewPreferredSkill("")
    setNewEducationRequirement("")
  }

  const addRequiredSkill = () => {
    if (!newRequiredSkill) return
    setRequiredSkills([...requiredSkills, newRequiredSkill])
    setNewRequiredSkill("")
  }

  const removeRequiredSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill))
  }

  const addPreferredSkill = () => {
    if (!newPreferredSkill) return
    setPreferredSkills([...preferredSkills, newPreferredSkill])
    setNewPreferredSkill("")
  }

  const removePreferredSkill = (skill: string) => {
    setPreferredSkills(preferredSkills.filter((s) => s !== skill))
  }

  const addEducationRequirement = () => {
    if (!newEducationRequirement) return
    setEducationRequirements([...educationRequirements, newEducationRequirement])
    setNewEducationRequirement("")
  }

  const removeEducationRequirement = (requirement: string) => {
    setEducationRequirements(educationRequirements.filter((r) => r !== requirement))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0099ff] hover:bg-[#0077cc] text-white">Create Job Description</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Create Job Description</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new job description to match resumes against.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-white">
              Job Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="e.g. Senior Frontend Developer"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-white">
              Job Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white min-h-[150px]"
              placeholder="Describe the job responsibilities, requirements, and qualifications..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="experience" className="text-white">
                Experience Level
              </Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="Entry Level">Entry Level</SelectItem>
                  <SelectItem value="Mid Level">Mid Level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department" className="text-white">
                Department
              </Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="e.g. Engineering"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location" className="text-white">
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="e.g. San Francisco, CA"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-white">Required Skills</Label>
            <div className="flex gap-2">
              <Input
                value={newRequiredSkill}
                onChange={(e) => setNewRequiredSkill(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Add a required skill"
                onKeyDown={(e) => e.key === "Enter" && addRequiredSkill()}
              />
              <Button type="button" onClick={addRequiredSkill} className="bg-[#0099ff] hover:bg-[#0077cc]">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {requiredSkills.map((skill) => (
                <Badge
                  key={skill}
                  className="bg-[#0099ff]/20 text-[#0099ff] hover:bg-[#0099ff]/30 border-[#0099ff]/30 flex items-center gap-1"
                >
                  {skill}
                  <button
                    onClick={() => removeRequiredSkill(skill)}
                    className="ml-1 hover:bg-[#0099ff]/20 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-white">Preferred Skills</Label>
            <div className="flex gap-2">
              <Input
                value={newPreferredSkill}
                onChange={(e) => setNewPreferredSkill(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Add a preferred skill"
                onKeyDown={(e) => e.key === "Enter" && addPreferredSkill()}
              />
              <Button type="button" onClick={addPreferredSkill} className="bg-[#0099ff] hover:bg-[#0077cc]">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {preferredSkills.map((skill) => (
                <Badge
                  key={skill}
                  className="bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700 flex items-center gap-1"
                >
                  {skill}
                  <button onClick={() => removePreferredSkill(skill)} className="ml-1 hover:bg-gray-700 rounded-full">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-white">Education Requirements</Label>
            <div className="flex gap-2">
              <Input
                value={newEducationRequirement}
                onChange={(e) => setNewEducationRequirement(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Add an education requirement"
                onKeyDown={(e) => e.key === "Enter" && addEducationRequirement()}
              />
              <Button type="button" onClick={addEducationRequirement} className="bg-[#0099ff] hover:bg-[#0077cc]">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {educationRequirements.map((requirement) => (
                <Badge
                  key={requirement}
                  className="bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700 flex items-center gap-1"
                >
                  {requirement}
                  <button
                    onClick={() => removeEducationRequirement(requirement)}
                    className="ml-1 hover:bg-gray-700 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title || !description}
            className="bg-[#0099ff] hover:bg-[#0077cc] text-white"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
