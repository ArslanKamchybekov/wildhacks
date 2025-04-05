import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, ChevronRight } from "lucide-react"

export function GoalsList() {
  // Mock data - in a real app, you would fetch this from your API
  const goals = [
    {
      id: "1",
      title: "Learn to play guitar",
      progress: 35,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      stakeType: "pet",
    },
    {
      id: "2",
      title: "Run a 5K",
      progress: 60,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      stakeType: "money",
    },
    {
      id: "3",
      title: "Read 12 books this year",
      progress: 25,
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      stakeType: "pet",
    },
  ]

  return (
    <div className="space-y-4">
      {goals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No active goals. Create one to get started!</div>
      ) : (
        goals.map((goal) => (
          <Link key={goal.id} href={`/goals/${goal.id}`}>
            <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{goal.title}</span>
                  <Badge variant={goal.stakeType === "pet" ? "outline" : "secondary"}>
                    {goal.stakeType === "pet" ? "Pet" : "Money"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    Due {goal.deadline.toLocaleDateString()} (
                    {Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days)
                  </span>
                </div>
                <div className="pt-2">
                  <Progress value={goal.progress} className="h-2" />
                  <div className="flex justify-between mt-1 text-xs">
                    <span>{goal.progress}% complete</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        ))
      )}
    </div>
  )
}

