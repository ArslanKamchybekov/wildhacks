"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCurrentUser } from "@/hooks/use-current-user"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Clock, Target, Play, Loader2 } from "lucide-react"
import { createSession, getActiveSessionsByUserId } from "@/app/actions/session"
import { getGroupsByMember } from "@/app/actions/group"

export default function SessionPage() {
  const router = useRouter()
  const { dbUser, isLoading: userLoading } = useCurrentUser()
  
  const [goal, setGoal] = useState("")
  const [timeAllocation, setTimeAllocation] = useState("30")
  const [groupId, setGroupId] = useState("")
  const [groups, setGroups] = useState<{id: string, name: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)

  // Load user's groups and active sessions
  useEffect(() => {
    async function loadData() {
      if (!dbUser?._id) return
      
      try {
        // Load groups
        if (dbUser.email) {
          const userGroups = await getGroupsByMember(dbUser.email)
          setGroups(userGroups.map(group => ({
            id: group.id,
            name: group.name
          })))
        }
        
        // Load active sessions
        const sessions = await getActiveSessionsByUserId(dbUser._id)
        setActiveSessions(sessions)
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load sessions")
      } finally {
        setIsLoadingSessions(false)
      }
    }
    
    if (dbUser) {
      loadData()
    }
  }, [dbUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dbUser?._id) {
      toast.error("You must be logged in to create a session")
      return
    }
    
    if (!goal) {
      toast.error("Please enter a goal for your session")
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Calculate deadline based on time allocation
      const now = new Date()
      const deadline = new Date(now.getTime() + parseInt(timeAllocation) * 60 * 1000)
      
      // Create session
      const sessionData = {
        userId: dbUser._id,
        groupId: groupId && groupId !== 'none' ? groupId : undefined,
        goal,
        deadline: deadline.toISOString()
      }
      
      const session = await createSession(sessionData)
      
      toast.success("Session created successfully")
      
      // Redirect to the active session page
      router.push(`/goals/session/${session._id}`)
    } catch (error) {
      console.error("Error creating session:", error)
      toast.error("Failed to create session")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTimeRemaining = (deadline: string) => {
    const endTime = new Date(deadline)
    const now = new Date()
    const diffMs = endTime.getTime() - now.getTime()
    
    if (diffMs <= 0) return "Expired"
    
    const diffMins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    
    return `${hours > 0 ? `${hours}h ` : ''}${mins}m remaining`
  }

  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Study Session" 
        text="Create a focused study session with a specific goal and time allocation"
      />
      
      <div className="grid gap-6">
        {/* Active Sessions */}
        {isLoadingSessions ? (
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : activeSessions.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Your ongoing study sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map(session => (
                  <div 
                    key={session._id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{session.goal}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatTimeRemaining(session.deadline)}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push(`/goals/session/${session._id}`)}
                    >
                      Continue
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
        
        {/* Create New Session */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Session</CardTitle>
            <CardDescription>Set up a focused study session</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal">What's your goal for this session?</Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., Complete chapter 5 of calculus textbook"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time Allocation (minutes)</Label>
                <Select value={timeAllocation} onValueChange={setTimeAllocation}>
                  <SelectTrigger id="time" className="w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {groups.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="group">Team (optional)</Label>
                  <Select value={groupId} onValueChange={setGroupId}>
                    <SelectTrigger id="group">
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No team</SelectItem>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Associating a session with a team allows for collaborative tracking
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !goal}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Session
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardShell>
  )
}
