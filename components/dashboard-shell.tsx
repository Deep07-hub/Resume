import type { ReactNode } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { User, Settings, LogOut, Bell } from "lucide-react"

interface DashboardShellProps {
  children: ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-950 to-gray-900">
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-gradient-to-r from-[#0066cc] to-[#0099ff] border-b border-gray-800 shadow-md flex items-center justify-between px-6">
        <div className="flex items-center">
          <div className="text-white text-xl font-bold">I2E</div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:bg-[#0066cc]/10">
            <span className="sr-only">Notifications</span>
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="text-white hover:bg-[#0066cc]/10">
            <span className="sr-only">Settings</span>
            <Settings className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt="User" />
                  <AvatarFallback className="bg-[#0099ff] text-white">GP</AvatarFallback>
                </Avatar>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 bg-gray-900 border-gray-800 text-white p-3">
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-800">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt="User" />
                  <AvatarFallback className="bg-[#0099ff] text-white">GP</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-gray-400">admin@example.com</p>
                </div>
              </div>
              <ul className="space-y-1">
                <li>
                  <Button variant="ghost" className="w-full justify-start text-gray-100 hover:text-white hover:bg-gray-800">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start text-gray-100 hover:text-white hover:bg-gray-800">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-gray-800">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </li>
              </ul>
            </PopoverContent>
          </Popover>
        </div>
      </header>
      <div className="pt-16 w-full">{children}</div>
    </div>
  )
}
