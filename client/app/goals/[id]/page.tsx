import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { MilestonesList } from "@/components/milestones-list"
import { AiInsights } from "@/components/ai-insights"
import { CalendarDays, Check, Clock, Upload } from "lucide-react"
import Link from "next/link"

export default function GoalDetailPage({ params }: { params: { id: string } }) {
  // Mock data - in a real app, you would fetch this from your API
  const goal = {
    id: params.id,
    title: "Learn to play guitar",
    description: "Master basic chords and be able to play 3 songs from start to finish",
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    progress: 35,
    stakeType: "pet",
    petType: "dragon",
    milestones: [
      {
        id: "1",
        title: "Purchase a guitar and accessories",
        due: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        completed: true,
      },
      {
        id: "2",
        title: "Learn basic chords (A, D, E, G, C)",
        due: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        completed: false,
      },
      {
        id: "3",
        title: "Practice chord transitions for 30 minutes daily",
        due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        completed: false,
      },
      {
        id: "4",
        title: "Learn first song from start to finish",
        due: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
        completed: false,
      },
      {
        id: "5",
        title: "Learn second and third songs",
        due: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
        completed: false,
      },
    ],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  }

  // Calculate days remaining
  const daysRemaining = Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <DashboardShell>
      <DashboardHeader heading={goal.title} text={goal.description}>
        <Link href={`/goals/${params.id}/submit`}>
          <Button>
            <Upload className="mr-2 h-4 w-4" /> Submit Progress
          </Button>
        </Link>
      </DashboardHeader>
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goal.progress}%</div>
              <Progress value={goal.progress} className="h-2 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Remaining</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{daysRemaining} days</div>
              <p className="text-xs text-muted-foreground">Deadline: {goal.deadline.toLocaleDateString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Created</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goal.createdAt.toLocaleDateString()}</div>
              <p className="text-xs text-muted-foreground">
                {Math.ceil((Date.now() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days ago
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>Track your progress through these milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <MilestonesList milestones={goal.milestones} editable={true} />
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              {goal.milestones.filter((m) => m.completed).length} of {goal.milestones.length} completed
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Personalized insights for this goal</CardDescription>
          </CardHeader>
          <CardContent>
            <AiInsights goalId={params.id} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

