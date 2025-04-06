"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, formatDistanceToNow } from "date-fns"
import { CalendarClock, CheckCircle, Clock, XCircle } from "lucide-react"
import { getAllSessionsByUserId } from "@/app/actions/session"

interface SessionHistoryProps {
  userId: string
  externalSessions?: Session[]
}

interface Session {
  _id: string
  goal: string
  status: 'active' | 'completed' | 'cancelled'
  deadline: string
  createdAt: Date
  updatedAt: Date
}

export function SessionHistory({ userId, externalSessions }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // If external sessions are provided, use them
    if (externalSessions) {
      setSessions(externalSessions)
      setIsLoading(false)
      return
    }
    
    // Otherwise fetch sessions directly
    async function fetchSessions() {
      if (!userId) return
      
      try {
        const sessionsData = await getAllSessionsByUserId(userId)
        
        const formattedSessions = sessionsData.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        }))
        
        setSessions(formattedSessions)
      } catch (error) {
        console.error("Error fetching sessions:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSessions()
  }, [userId, externalSessions])
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
      case 'completed':
        return "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
      case 'cancelled':
        return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
      default:
        return "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" /> Session History
        </CardTitle>
        <CardDescription>Your recent study and focus sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
              <CalendarClock className="h-12 w-12 mb-2" />
              <p>No sessions yet! Start one to begin tracking your productivity.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session._id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{session.goal}</h4>
                    <Badge className={getStatusColor(session.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(session.status)}
                        <span className="capitalize">{session.status}</span>
                      </div>
                    </Badge>
                  </div>
                  <div className="flex flex-col text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{formatDistanceToNow(session.createdAt, { addSuffix: true })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deadline:</span>
                      <span>{format(new Date(session.deadline), 'MMM d, yyyy')}</span>
                    </div>
                    {session.status !== 'active' && (
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span>{formatDistanceToNow(session.updatedAt, { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
