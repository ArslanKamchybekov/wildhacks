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
import { formatDistanceToNow } from "date-fns"
import { AlertTriangle, Laugh, Flame } from "lucide-react"

interface RoastHistoryProps {
  userId: string
}

interface Roast {
  id: string
  content: string
  level: number
  groupId: string
  createdAt: Date
}

export function RoastHistory({ userId }: RoastHistoryProps) {
  const [roasts, setRoasts] = useState<Roast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function fetchRoasts() {
      try {
        const response = await fetch(`/api/roasts?userId=${userId}`)
        const data = await response.json()
        
        if (data.roasts) {
          setRoasts(data.roasts.map((roast: any) => ({
            ...roast,
            createdAt: new Date(roast.createdAt)
          })))
        }
      } catch (error) {
        console.error("Error fetching roast history:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (userId) {
      fetchRoasts()
    }
  }, [userId])
  
  const getRoastIcon = (level: number) => {
    if (level >= 7) return <Flame className="h-4 w-4 text-red-500" />
    if (level >= 4) return <AlertTriangle className="h-4 w-4 text-amber-500" />
    return <Laugh className="h-4 w-4 text-green-500" />
  }
  
  const getRoastColor = (level: number) => {
    if (level >= 7) return "bg-red-50 dark:bg-red-900/20"
    if (level >= 4) return "bg-amber-50 dark:bg-amber-900/20"
    return "bg-green-50 dark:bg-green-900/20"
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5" /> Recent Roasts
        </CardTitle>
        <CardDescription>Your recent roasts from Gemini</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : roasts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
              <Laugh className="h-12 w-12 mb-2" />
              <p>No roasts yet! Maybe that's a good thing?</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roasts.map((roast) => (
                <div key={roast.id} className={`p-4 rounded-lg space-y-2 ${getRoastColor(roast.level)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRoastIcon(roast.level)}
                      <span className="text-sm font-medium">
                        Level {roast.level} Roast
                      </span>
                    </div>
                    <Badge variant="outline">
                      {formatDistanceToNow(roast.createdAt, { addSuffix: true })}
                    </Badge>
                  </div>
                  <p className="text-sm">{roast.content}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
