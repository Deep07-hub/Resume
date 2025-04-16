"use client"

import React, { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Briefcase, GraduationCap, Filter, Search, X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

export type FiltersType = {
  skills: string[]
  experience: string[]
  education: string[]
  status: string[]
}

export interface ResumeSidebarProps {
  filters: FiltersType
  onFilterChange: (filters: FiltersType) => void
}

// Reduced list of skills to simplify the UI
const popularSkills = [
  "JavaScript", "React", "Python", "Java", "TypeScript", 
  "AWS", "Docker", "SQL", "HTML", "CSS", "C#", "Angular", 
  "PHP", "Ruby", "Go", "Swift", "Node.js", "Vue.js", "MongoDB",
  "GraphQL", "Git", "Express", "Kubernetes", "Next.js", "Redux",
  "Machine Learning", "Data Science", "Agile", "Jira", "Scrum"
]

export function ResumeSidebar({ filters, onFilterChange }: ResumeSidebarProps) {
  const [skillSearch, setSkillSearch] = useState("")
  const [localFilters, setLocalFilters] = useState<FiltersType>(filters)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchTerms, setSearchTerms] = useState({
    skills: "",
    experience: "",
    education: "",
    status: ""
  })
  
  // Get skills to display - top 5 or filtered by search
  const displayedSkills = searchTerms.skills
    ? popularSkills.filter(skill => 
        skill.toLowerCase().includes(searchTerms.skills.toLowerCase()))
    : popularSkills.slice(0, 5)
  
  const handleFilterChange = (
    type: keyof FiltersType,
    value: string,
    checked: boolean
  ) => {
    const newLocalFilters = { ...localFilters };
    
    if (checked) {
      newLocalFilters[type] = [...newLocalFilters[type], value];
    } else {
      newLocalFilters[type] = newLocalFilters[type].filter((item) => item !== value);
    }
    
    setLocalFilters(newLocalFilters);
  }

  const applyFilters = () => {
    onFilterChange(localFilters);
    toast.success("Filters applied", {
      description: "Showing filtered resumes"
    });
  }
  
  const clearFilters = () => {
    const emptyFilters: FiltersType = {
      skills: [],
      experience: [],
      education: [],
      status: []
    }
    setLocalFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const handleSearchTermChange = (category: keyof typeof searchTerms, value: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [category]: value
    }))
  }

  const activeFilterCount = Object.values(localFilters).flat().length

  return (
    <div className={`h-full border-r border-gray-800 transition-all duration-300 ${
      isCollapsed ? 'w-[60px]' : 'w-[320px]'
    }`}>
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!isCollapsed && <span className="font-medium text-white">Filters</span>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto text-gray-400 hover:text-white hover:bg-gray-800"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className={`${isCollapsed ? 'px-2' : 'px-4'} pb-4 space-y-6`}>
          {/* Skills filter */}
          <div className="group pt-4">
            <h3 className={`flex items-center text-sm font-medium text-white mb-3 group-hover:text-blue-500 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
              <Sparkles className="h-4 w-4 text-blue-500 mr-2" />
              {!isCollapsed && "Skills"}
            </h3>
            
            {!isCollapsed && (
              <>
              <div className="mb-3 relative">
                <Input
                  type="text"
                  placeholder="Search skills..."
                  value={searchTerms.skills}
                  onChange={(e) => handleSearchTermChange("skills", e.target.value)}
                  className="bg-gray-800 border-gray-700 focus:border-blue-500 text-white w-full pr-8 rounded-md"
                />
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-2">
                {displayedSkills.map((skill) => (
                  <div key={skill} className="flex items-center group/item">
                    <Checkbox
                      id={`skill-${skill}`}
                      checked={localFilters.skills.includes(skill)}
                      onCheckedChange={(checked) => handleFilterChange("skills", skill, checked as boolean)}
                      className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <label
                      htmlFor={`skill-${skill}`}
                      className="ml-2 text-sm text-gray-300 cursor-pointer group-hover/item:text-white"
                    >
                      {skill}
                    </label>
                  </div>
                ))}
                {searchTerms.skills && displayedSkills.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No skills match your search</p>
                )}
              </div>
              </>
            )}
            
            {isCollapsed && localFilters.skills.length > 0 && (
              <div className={`h-6 w-6 rounded-full flex items-center justify-center bg-blue-500 mx-auto text-xs font-medium text-white`}>
                {localFilters.skills.length}
              </div>
            )}
          </div>

          {!isCollapsed && <Separator className="my-4 bg-gray-800/50" />}

          {/* Experience section */}
          <div className="group">
            <h3 className={`flex items-center text-sm font-medium text-white mb-3 group-hover:text-purple-500 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
              <Briefcase className="h-4 w-4 text-purple-500 mr-2" />
              {!isCollapsed && "Experience Level"}
            </h3>
            
            {!isCollapsed && (
              <>
              <div className="mb-3 relative">
                <Input
                  type="text"
                  placeholder="Search experience..."
                  value={searchTerms.experience}
                  onChange={(e) => handleSearchTermChange("experience", e.target.value)}
                  className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white w-full pr-8 rounded-md"
                />
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-2">
                {["Entry Level", "Mid Level", "Senior", "Lead", "Manager"].map((exp) => (
                  (!searchTerms.experience || exp.toLowerCase().includes(searchTerms.experience.toLowerCase())) && (
                    <div key={exp} className="flex items-center group/item">
                      <Checkbox
                        id={`exp-${exp}`}
                        checked={localFilters.experience.includes(exp)}
                        onCheckedChange={(checked) => handleFilterChange("experience", exp, checked as boolean)}
                        className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <label
                        htmlFor={`exp-${exp}`}
                        className="ml-2 text-sm text-gray-300 cursor-pointer group-hover/item:text-white"
                      >
                        {exp}
                      </label>
                    </div>
                  )
                ))}
              </div>
              </>
            )}
            
            {isCollapsed && localFilters.experience.length > 0 && (
              <div className={`h-6 w-6 rounded-full flex items-center justify-center bg-purple-500 mx-auto text-xs font-medium text-white`}>
                {localFilters.experience.length}
              </div>
            )}
          </div>

          {!isCollapsed && <Separator className="my-4 bg-gray-800/50" />}

          {/* Education section */}
          <div className="group">
            <h3 className={`flex items-center text-sm font-medium text-white mb-3 group-hover:text-amber-500 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
              <GraduationCap className="h-4 w-4 text-amber-500 mr-2" />
              {!isCollapsed && "Education"}
            </h3>
            
            {!isCollapsed && (
              <>
              <div className="mb-3 relative">
                <Input
                  type="text"
                  placeholder="Search education..."
                  value={searchTerms.education}
                  onChange={(e) => handleSearchTermChange("education", e.target.value)}
                  className="bg-gray-800 border-gray-700 focus:border-amber-500 text-white w-full pr-8 rounded-md"
                />
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-2">
                {["High School", "Associate's", "Bachelor's", "Master's", "PhD"].map((edu) => (
                  (!searchTerms.education || edu.toLowerCase().includes(searchTerms.education.toLowerCase())) && (
                    <div key={edu} className="flex items-center group/item">
                      <Checkbox
                        id={`edu-${edu}`}
                        checked={localFilters.education.includes(edu)}
                        onCheckedChange={(checked) => handleFilterChange("education", edu, checked as boolean)}
                        className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                      <label
                        htmlFor={`edu-${edu}`}
                        className="ml-2 text-sm text-gray-300 cursor-pointer group-hover/item:text-white"
                      >
                        {edu}
                      </label>
                    </div>
                  )
                ))}
              </div>
              </>
            )}
            
            {isCollapsed && localFilters.education.length > 0 && (
              <div className={`h-6 w-6 rounded-full flex items-center justify-center bg-amber-500 mx-auto text-xs font-medium text-white`}>
                {localFilters.education.length}
              </div>
            )}
          </div>

          {!isCollapsed && <Separator className="my-4 bg-gray-800/50" />}

          {/* Status section */}
          <div className="group">
            <h3 className={`flex items-center text-sm font-medium text-white mb-3 group-hover:text-green-500 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
              <Filter className="h-4 w-4 text-green-500 mr-2" />
              {!isCollapsed && "Status"}
            </h3>
            
            {!isCollapsed && (
              <>
              <div className="mb-3 relative">
                <Input
                  type="text"
                  placeholder="Search status..."
                  value={searchTerms.status}
                  onChange={(e) => handleSearchTermChange("status", e.target.value)}
                  className="bg-gray-800 border-gray-700 focus:border-green-500 text-white w-full pr-8 rounded-md"
                />
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-2">
                {["New", "Reviewed", "Shortlisted", "Rejected", "Processed"].map((status) => (
                  (!searchTerms.status || status.toLowerCase().includes(searchTerms.status.toLowerCase())) && (
                    <div key={status} className="flex items-center group/item">
                      <Checkbox
                        id={`status-${status}`}
                        checked={localFilters.status.includes(status)}
                        onCheckedChange={(checked) => handleFilterChange("status", status, checked as boolean)}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label
                        htmlFor={`status-${status}`}
                        className="ml-2 text-sm text-gray-300 cursor-pointer group-hover/item:text-white"
                      >
                        {status}
                      </label>
                    </div>
                  )
                ))}
              </div>
              </>
            )}
            
            {isCollapsed && localFilters.status.length > 0 && (
              <div className={`h-6 w-6 rounded-full flex items-center justify-center bg-green-500 mx-auto text-xs font-medium text-white`}>
                {localFilters.status.length}
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="mt-6 flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={applyFilters}
                className="flex-1 bg-gradient-to-r from-blue-600 to-[#0099ff] hover:from-blue-700 hover:to-[#0088ee] text-white"
              >
                Apply Filters
              </Button>
              
              {activeFilterCount > 0 && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-red-900/50 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
