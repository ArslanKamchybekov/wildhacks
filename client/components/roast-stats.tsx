"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { format, subDays } from "date-fns"
import { Flame } from "lucide-react"

interface RoastStatsProps {
  userId: string
}

interface RoastStats {
  totalRoasts: number
  averageLevel: number
  roastsByDate: { date: string; count: number }[]
}

export function RoastStats({ userId }: RoastStatsProps) {
  const [stats, setStats] = useState<RoastStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/roasts?userId=${userId}&stats=true`)
        const data = await response.json()
        
        if (data.stats) {
          setStats(data.stats)
          
          // Fill in missing dates with zero values for the last 7 days
          if (data.stats.roastsByDate) {
            const filledData = fillMissingDates(data.stats.roastsByDate)
            setStats({
              ...data.stats,
              roastsByDate: filledData
            })
          }
        }
      } catch (error) {
        console.error("Error fetching roast stats:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (userId) {
      fetchStats()
    }
  }, [userId])
  
  // Helper function to fill in missing dates with zero counts
  const fillMissingDates = (data: { date: string; count: number }[]) => {
    const today = new Date()
    const result = []
    const dateMap = new Map()
    
    // Convert existing data to a map for quick lookup
    data.forEach(item => {
      dateMap.set(item.date, item.count)
    })
    
    // Fill in data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const dateString = format(date, 'yyyy-MM-dd')
      const formattedDate = format(date, 'MMM d')
      
      result.push({
        date: formattedDate,
        count: dateMap.get(dateString) || 0
      })
    }
    
    return result
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5" /> Roast Analytics
        </CardTitle>
        <CardDescription>Your roasting activity over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
            <Skeleton className="h-[180px] w-full" />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold">{stats.totalRoasts}</div>
                <div className="text-xs text-muted-foreground">Total Roasts</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold">{stats.averageLevel}</div>
                <div className="text-xs text-muted-foreground">Avg. Roast Level</div>
              </div>
            </div>
            
            <div className="h-[180px]">
              {stats.roastsByDate && stats.roastsByDate.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.roastsByDate}>
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Bar dataKey="count" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  No roast data available
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[240px] text-center text-muted-foreground">
            Failed to load roast statistics
          </div>
        )}
      </CardContent>
    </Card>
  )
}
