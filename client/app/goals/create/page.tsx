"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/date-picker"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { MilestonesList } from "@/components/milestones-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, Egg, Loader2, Sparkles } from "lucide-react"
import { PetSelection } from "@/components/pet-selection"
import { MoneyStake } from "@/components/money-stake"

export default function CreateGoalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [goalTitle, setGoalTitle] = useState("")
  const [goalDescription, setGoalDescription] = useState("")
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [stakeType, setStakeType] = useState("pet")
  const [selectedPet, setSelectedPet] = useState("dragon")
  const [stakeAmount, setStakeAmount] = useState(10)
  const [milestones, setMilestones] = useState<any[]>([])
  const [aiProcessing, setAiProcessing] = useState(false)

  const generateMilestones = async () => {
    if (!goalTitle || !goalDescription || !deadline) return

    setAiProcessing(true)

    // Simulate AI processing
    setTimeout(() => {
      // Mock milestones that would be generated by Gemini AI
      const mockMilestones = [
        {
          title: "Research and gather resources",
          due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          completed: false,
        },
        { title: "Complete initial setup", due: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), completed: false },
        { title: "Reach 25% progress", due: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), completed: false },
        { title: "Reach 50% progress", due: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), completed: false },
        { title: "Reach 75% progress", due: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), completed: false },
        { title: "Complete final steps", due: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000), completed: false },
      ]

      setMilestones(mockMilestones)
      setAiProcessing(false)
    }, 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      router.push("/dashboard")
    }, 1500)
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Create New Goal" text="Set up a new goal with AI-powered milestones" />
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Goal Details</CardTitle>
              <CardDescription>Describe your goal and set a deadline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Learn to play guitar"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your goal in detail..."
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <DatePicker date={deadline} onDateChange={setDeadline} />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={generateMilestones}
                disabled={!goalTitle || !goalDescription || !deadline || aiProcessing}
              >
                {aiProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Milestones...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Milestones with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Milestones</CardTitle>
                <CardDescription>AI-generated milestones for your goal</CardDescription>
              </CardHeader>
              <CardContent>
                <MilestonesList milestones={milestones} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Choose Your Stake</CardTitle>
              <CardDescription>What's at stake if you don't complete your goal?</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={stakeType} onValueChange={setStakeType}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pet" className="flex items-center gap-2">
                    <Egg className="h-4 w-4" />
                    Pet Mode
                  </TabsTrigger>
                  <TabsTrigger value="money" className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Stake Mode
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pet" className="pt-4">
                  <PetSelection selectedPet={selectedPet} onSelectPet={setSelectedPet} />
                </TabsContent>
                <TabsContent value="money" className="pt-4">
                  <MoneyStake amount={stakeAmount} onAmountChange={setStakeAmount} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || milestones.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Goal"
              )}
            </Button>
          </div>
        </div>
      </form>
    </DashboardShell>
  )
}

