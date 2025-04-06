"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCurrentUser } from "@/hooks/use-current-user"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Clock, Target, CheckCircle, XCircle, ArrowLeft, Loader2 } from "lucide-react"
import { getSessionById, updateSessionStatus } from "@/app/actions/session"
import { addTickData } from "@/app/actions/user"

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { dbUser } = useCurrentUser()
  
  const [session, setSession] = useState<any>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [totalTime, setTotalTime] = useState<number>(0)
  const [progress, setProgress] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  // Load session data
  useEffect(() => {
    async function loadSession() {
      if (!params?.id) return
      
      try {
        const sessionData = await getSessionById(params.id)
        if (!sessionData) {
          toast.error("Session not found")
          router.push("/goals/session")
          return
        }
        
        setSession(sessionData)
        
        // Calculate time remaining
        const deadline = new Date(sessionData.deadline)
        const now = new Date()
        const diffMs = deadline.getTime() - now.getTime()
        
        if (diffMs <= 0) {
          setIsExpired(true)
          setTimeRemaining(0)
        } else {
          setTimeRemaining(Math.floor(diffMs / 1000))
        }
        
        // Calculate total session time
        const createdAt = new Date(sessionData.createdAt)
        const totalMs = deadline.getTime() - createdAt.getTime()
        setTotalTime(Math.floor(totalMs / 1000))
      } catch (error) {
        console.error("Error loading session:", error)
        toast.error("Failed to load session")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSession()
  }, [params?.id, router])

  // Timer countdown
  useEffect(() => {
    if (isLoading || timeRemaining <= 0) return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [isLoading, timeRemaining])

  // Update progress
  useEffect(() => {
    if (totalTime > 0 && timeRemaining >= 0) {
      const elapsed = totalTime - timeRemaining
      const progressPercent = Math.min(100, Math.round((elapsed / totalTime) * 100))
      setProgress(progressPercent)
    }
  }, [timeRemaining, totalTime])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${secs}s`
  }

  const handleCompleteSession = async () => {
    if (!session || !dbUser?._id) return
    
    try {
      setIsSubmitting(true)
      
      // Update session status
      await updateSessionStatus(session._id, 'completed')
      
      // Add tick data if session is associated with a group
      if (session.groupId && dbUser._id) {
        await addTickData(dbUser._id, `Completed a ${formatTime(totalTime)} study session on: ${session.goal}`)
      }
      
      toast.success("Session completed successfully")
      router.push("/goals/session")
    } catch (error) {
      console.error("Error completing session:", error)
      toast.error("Failed to complete session")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelSession = async () => {
    if (!session) return
    
    try {
      setIsSubmitting(true)
      await updateSessionStatus(session._id, 'cancelled')
      toast.success("Session cancelled")
      router.push("/goals/session")
    } catch (error) {
      console.error("Error cancelling session:", error)
      toast.error("Failed to cancel session")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    )
  }

  if (!session) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <p className="text-muted-foreground">Session not found</p>
          <Button onClick={() => router.push("/goals/session")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/goals/session")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sessions
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Active Session
          </CardTitle>
          <CardDescription>
            {isExpired ? "Time's up! Complete your session." : "Focus on your goal until the timer ends."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-1">Session Goal:</h3>
            <p>{session.goal}</p>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {isExpired ? "Time's up!" : "Time Remaining:"}
              </span>
            </div>
            <div className="text-4xl font-bold mb-2">
              {isExpired ? "00:00:00" : formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-muted-foreground">
              Session ends at {new Date(session.deadline).toLocaleTimeString()}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full" 
            onClick={handleCompleteSession}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Session
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleCancelSession}
            disabled={isSubmitting}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Session
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Session Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc pl-5">
            <li>Stay focused on your goal for the entire session</li>
            <li>Put away distractions like your phone</li>
            <li>Take short breaks if needed to maintain productivity</li>
            <li>Complete the session even if you finish your goal early</li>
            <li>If you're part of a team, your completed sessions will be visible to team members</li>
          </ul>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
