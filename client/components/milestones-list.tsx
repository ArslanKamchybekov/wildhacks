"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Pencil } from "lucide-react"

interface Milestone {
  id: string
  title: string
  due: Date
  completed: boolean
}

interface MilestonesListProps {
  milestones: Milestone[]
  editable?: boolean
}

export function MilestonesList({ milestones, editable = false }: MilestonesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  // Function to determine if a milestone is overdue
  const isOverdue = (date: Date) => {
    return date < new Date() && !milestones.find((m) => m.id === editingId)?.completed
  }

  // Function to format the due date with a relative time
  const formatDueDate = (date: Date) => {
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`
    } else if (diffDays === 0) {
      return "Due today"
    } else if (diffDays === 1) {
      return "Due tomorrow"
    } else {
      return `Due in ${diffDays} days`
    }
  }

  return (
    <div className="space-y-4">
      {milestones.map((milestone) => (
        <div
          key={milestone.id}
          className={`flex items-start justify-between rounded-lg border p-4 ${
            milestone.completed ? "bg-muted/50" : ""
          }`}
        >
          <div className="flex items-start gap-3">
            <Checkbox checked={milestone.completed} disabled={!editable} className="mt-1" />
            <div className="space-y-1">
              <div className="font-medium">{milestone.title}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>{formatDueDate(milestone.due)}</span>
                {isOverdue(milestone.due) && (
                  <Badge variant="destructive" className="ml-2">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {editable && (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit milestone</span>
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

