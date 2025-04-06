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
        <div>
          <h3 className="text-lg font-medium">Profile Settings</h3>
          <p className="text-sm text-muted-foreground">
            Update your account settings and profile information.
          </p>
        </div>
        
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
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Account Created</p>
              <p className="text-sm text-muted-foreground">
                {dbUser.createdAt ? new Date(dbUser.createdAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-muted-foreground">
                {dbUser.updatedAt ? new Date(dbUser.updatedAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browser Extension</CardTitle>
            <CardDescription>
              Connect your browser extension to track productivity and get roasts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">Connect your GoalKeeper browser extension to track your productivity and receive roasts when you get distracted.</p>
              <Button 
                onClick={() => {
                  // Generate a connection token (user ID + timestamp + simple hash)
                  const token = `${dbUser._id}-${Date.now()}-${auth0User.email?.split('@')[0] || 'user'}`;
                  
                  // Create connection data
                  const connectionData = {
                    token,
                    userId: dbUser._id,
                    userEmail: auth0User.email,
                    userName: name || auth0User.name || 'User',
                    timestamp: Date.now()
                  };
                  
                  // Store connection data in localStorage for the extension to access
                  console.log('Connection data:', connectionData);
                  localStorage.setItem('goalkeeper_extension_data', JSON.stringify(connectionData));
                  
                  // Create a more visible debug element
                  const debugDiv = document.createElement('div');
                  debugDiv.style.position = 'fixed';
                  debugDiv.style.bottom = '10px';
                  debugDiv.style.right = '10px';
                  debugDiv.style.padding = '10px';
                  debugDiv.style.background = 'rgba(0,0,0,0.7)';
                  debugDiv.style.color = 'white';
                  debugDiv.style.zIndex = '9999';
                  debugDiv.style.borderRadius = '5px';
                  debugDiv.textContent = 'Extension data ready! Check localStorage for: goalkeeper_extension_data';
                  document.body.appendChild(debugDiv);
                  
                  // Notify extension that data is available - use a more specific event
                  window.dispatchEvent(new CustomEvent('GOALKEEPER_CONNECT_EVENT', { detail: connectionData }));
                  window.postMessage({ type: 'GOALKEEPER_CONNECT', data: connectionData }, '*');
                  
                  toast.success("Ready to connect! Now click 'Connect' in your browser extension.");
                }}
              >
                Generate Connection
              </Button>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                After clicking the button above, open your GoalKeeper extension and click "Connect" to link your account.
                The connection will expire after 5 minutes for security reasons.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
