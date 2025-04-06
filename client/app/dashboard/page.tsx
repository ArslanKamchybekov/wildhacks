"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { RoastHistory } from "@/components/roast-history"
import { RoastStats } from "@/components/roast-stats"
import { SessionHistory } from "@/components/session-history"
import { Clock, Focus, Plus, Target, Trophy } from "lucide-react"
import Link from "next/link"
import { useCurrentUser } from "@/hooks/use-current-user"
import { getAllSessionsByUserId } from "@/app/actions/session"
import { differenceInMinutes, isToday, startOfYesterday, endOfYesterday } from "date-fns"

export default function DashboardPage() {
  const { dbUser } = useCurrentUser()
  const [sessions, setSessions] = useState<any[]>([])
  const [focusTime, setFocusTime] = useState({ total: 0, change: 0 })
  const [goalsCompleted, setGoalsCompleted] = useState({ total: 0, percentage: 0 })
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<any | null>(null)
  
  useEffect(() => {
    async function fetchSessionData() {
      if (!dbUser?._id) return
      
      try {
        // Get all sessions
        const sessionsData = await getAllSessionsByUserId(dbUser._id)
        
        const formattedSessions = sessionsData.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          deadline: new Date(session.deadline)
        }))
        
        setSessions(formattedSessions)
        
        // Calculate focus time (today's sessions)
        const todaySessions = formattedSessions.filter((session: any) => 
          isToday(new Date(session.createdAt))
        )
        
        let todayMinutes = 0
        todaySessions.forEach((session: any) => {
          // For active sessions, calculate time from creation until now
          if (session.status === 'active') {
            todayMinutes += differenceInMinutes(new Date(), session.createdAt)
          } 
          // For completed sessions, calculate time from creation until update
          else if (session.status === 'completed') {
            todayMinutes += differenceInMinutes(session.updatedAt, session.createdAt)
          }
        })
        
        // Calculate yesterday's focus time for comparison
        const yesterdaySessions = formattedSessions.filter((session: any) => {
          const date = new Date(session.createdAt)
          return date >= startOfYesterday() && date <= endOfYesterday()
        })
        
        let yesterdayMinutes = 0
        yesterdaySessions.forEach((session: any) => {
          if (session.status === 'completed') {
            yesterdayMinutes += differenceInMinutes(session.updatedAt, session.createdAt)
          }
        })

        const activeSession = todaySessions.find((session: any) => session.status === 'active')
        setActiveSession(activeSession)
        
        // Calculate change from yesterday
        const change = todayMinutes - yesterdayMinutes
        setFocusTime({ 
          total: todayMinutes, 
          change: change 
        })
        
        // Calculate goals completed
        const completedSessions = formattedSessions.filter((session: any) => 
          session.status === 'completed'
        )
        
        const completedCount = completedSessions.length
        const totalCount = formattedSessions.length || 1 // Avoid division by zero
        const completionPercentage = Math.round((completedCount / totalCount) * 100)
        
        setGoalsCompleted({
          total: completedCount,
          percentage: completionPercentage
        })
      } catch (error) {
        console.error("Error fetching session data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSessionData()
  }, [dbUser?._id])
  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Track your goals and pet progress">
        <Link href="/goals/session">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Goal
          </Button>
        </Link>
      </DashboardHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time Today</CardTitle>
            <Focus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "--" : `${Math.floor(focusTime.total / 60)}hr ${focusTime.total % 60}m`}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "--" : focusTime.change > 0 ? 
                `+${Math.floor(focusTime.change / 60)}hr ${focusTime.change % 60}m from yesterday` : 
                `${Math.floor(Math.abs(focusTime.change) / 60)}hr ${Math.abs(focusTime.change) % 60}m less than yesterday`}
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "--" : `${goalsCompleted.total}/${sessions.length || 1}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "--" : `${goalsCompleted.percentage}% completion rate`}
            </p>
          </CardContent>
        </Card>
        {activeSession && (
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Session Deadline</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{new Date(activeSession.deadline).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })}
            </div>
              <p className="text-xs text-muted-foreground">"{activeSession.goal}" milestone</p>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-1">
          <RoastStats userId={dbUser?._id || ""} />
        </div>
        <div className="col-span-1">
          <RoastHistory userId={dbUser?._id || ""} />
        </div>
        <div className="col-span-1">
          <SessionHistory userId={dbUser?._id || ""} externalSessions={sessions} />
        </div>
      </div>
    </DashboardShell>
  )
}

