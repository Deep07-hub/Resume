"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DashboardHeaderProps {
  onSearch: (query: string) => void
}

export function DashboardHeader({ onSearch }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-black px-6">
      <div className="flex items-center gap-2 font-semibold text-xl text-white">
        <div className="flex items-center">
          <span className="text-[#0099ff] font-bold">i2e</span>
          <span className="ml-1 text-white">ResumeParser</span>
        </div>
      </div>
      <div className="flex w-full max-w-sm items-center space-x-2 mx-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search resumes..."
            className="w-full bg-gray-800 text-white border-gray-700 pl-8 focus-visible:ring-[#0099ff]"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button className="bg-[#0099ff] hover:bg-[#0077cc] text-white">Upload Resumes</Button>
        <Avatar>
          <AvatarImage src="/placeholder.svg" alt="User" />
          <AvatarFallback className="bg-[#0099ff] text-white">HR</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
