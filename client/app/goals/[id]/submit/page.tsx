"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { FileUploader } from "@/components/file-uploader"
import { Loader2, Upload } from "lucide-react"

export default function SubmitProgressPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [milestone, setMilestone] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])

  // Mock data - in a real app, you would fetch this from your API
  const goal = {
    id: params.id,
    title: "Learn to play guitar",
    milestones: [
      { id: "1", title: "Purchase a guitar and accessories", completed: true },
      { id: "2", title: "Learn basic chords (A, D, E, G, C)", completed: false },
      { id: "3", title: "Practice chord transitions for 30 minutes daily", completed: false },
      { id: "4", title: "Learn first song from start to finish", completed: false },
      { id: "5", title: "Learn second and third songs", completed: false },
    ],
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      router.push(`/goals/${params.id}`)
    }, 1500)
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Submit Progress" text={`Update your progress for "${goal.title}"`} />
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Progress Update</CardTitle>
            <CardDescription>Provide details about your progress and upload any proof</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="milestone">Milestone</Label>
              <Select value={milestone} onValueChange={setMilestone} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a milestone" />
                </SelectTrigger>
                <SelectContent>
                  {goal.milestones
                    .filter((m) => !m.completed)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you've accomplished..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Proof of Progress</Label>
              <FileUploader
                onFilesSelected={setFiles}
                maxFiles={3}
                acceptedFileTypes={["image/*", "video/*", "audio/*", ".pdf"]}
              />
              <p className="text-xs text-muted-foreground">
                Upload photos, videos, or documents as proof of your progress
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={loading || !milestone || !description}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Progress
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </DashboardShell>
  )
}

