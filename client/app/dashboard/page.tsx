import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { PetDisplay } from "@/components/pet-display"
import { GoalsList } from "@/components/goals-list"
import { AiInsights } from "@/components/ai-insights"
import { CalendarDays, Clock, Plus, Target, Trophy } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Track your goals and pet progress">
        <Link href="/goals/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Goal
          </Button>
        </Link>
      </DashboardHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground">+2 from last week</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3/5</div>
            <p className="text-xs text-muted-foreground">60% completion rate</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Deadline</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 days</div>
            <p className="text-xs text-muted-foreground">"Learn Guitar" milestone</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-7 md:col-span-3">
          <CardHeader>
            <CardTitle>Your Pet</CardTitle>
            <CardDescription>Keep your pet healthy by completing your goals</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <PetDisplay type="dragon" stage={2} health={85} />
            <div className="w-full mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Health</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />
              <div className="flex justify-between text-sm">
                <span>Growth Progress</span>
                <span>Stage 2/5</span>
              </div>
              <Progress value={40} className="h-2" />
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Last fed 8 hours ago
            </div>
          </CardFooter>
        </Card>
        <Card className="col-span-7 md:col-span-4">
          <CardHeader>
            <CardTitle>Active Goals</CardTitle>
            <CardDescription>Your current goals and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList className="mb-4">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                <GoalsList />
              </TabsContent>
              <TabsContent value="completed">
                <div className="text-center py-8 text-muted-foreground">No completed goals yet</div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Link href="/goals/create">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Goal
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Personalized insights based on your goal progress</CardDescription>
          </CardHeader>
          <CardContent>
            <AiInsights />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

