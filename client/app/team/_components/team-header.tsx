"use client"

import { Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardHeader } from "@/components/dashboard-header"

interface Group {
  id: string
  name: string
  description: string
}

interface TeamHeaderProps {
  title: string
  groups: Group[]
  selectedGroupId: string
  onGroupChange: (value: string) => void
}

export function TeamHeader({ title, groups, selectedGroupId, onGroupChange }: TeamHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <DashboardHeader 
        heading={title} 
        text="Manage your team and pet"
      />
      {groups.length > 0 && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <Select value={selectedGroupId} onValueChange={onGroupChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

