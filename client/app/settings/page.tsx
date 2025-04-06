"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardShell } from "@/components/dashboard-shell"
import { useCurrentUser } from "@/hooks/use-current-user"
import { updateUser } from "@/app/actions/user"
import { DashboardHeader } from "@/components/dashboard-header"

export default function SettingsPage() {
  const { dbUser, auth0User, isLoading } = useCurrentUser()
  const router = useRouter()
  
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (dbUser) {
      setName(dbUser.name || "")
    }
  }, [dbUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dbUser?._id) {
      toast.error("User information not available")
      return
    }
    
    try {
      setIsSubmitting(true)
      
      await updateUser(dbUser._id, {
        name
      })
      
      toast.success("Profile updated successfully")
      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (!auth0User || !dbUser) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Please sign in to view your settings</p>
            <Button className="mt-4" onClick={() => router.push("/api/auth/login")}>
              Sign In
            </Button>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader 
          heading="Profile Settings" 
          text="Update your account settings and profile information"
        />
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Update your personal information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={auth0User.email || ""} 
                  disabled 
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Your email address is managed by your authentication provider and cannot be changed here.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your name"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Information about your account.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </DashboardShell>
  )
}
