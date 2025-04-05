"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Users } from "lucide-react"
import { createGroup } from "@/app/actions/group"

interface GroupCreationProps {
  userId: string
  onGroupCreated: (groupId: string) => void
}

export function GroupCreation({ userId, onGroupCreated }: GroupCreationProps) {
  const [groupName, setGroupName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [invitedMembers, setInvitedMembers] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")

  const handleAddMember = () => {
    if (!inviteEmail) return
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      setError("Please enter a valid email address")
      return
    }
    
    if (invitedMembers.includes(inviteEmail)) {
      setError("This email has already been added")
      return
    }
    
    setInvitedMembers([...invitedMembers, inviteEmail])
    setInviteEmail("")
    setError("")
  }

  const handleRemoveMember = (email: string) => {
    setInvitedMembers(invitedMembers.filter(member => member !== email))
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name")
      return
    }

    try {
      setIsCreating(true)
      setError("")
      
      // Include the current user in the members list
      const members = [userId, ...invitedMembers]
      
      const group = await createGroup({
        name: groupName,
        members,
        createdBy: userId
      })
      
      // The group object now has an id field (serialized from the server action)
      if (group && group.id) {
        onGroupCreated(group.id)
      } else {
        throw new Error("Group creation failed: No group ID returned")
      }
    } catch (error) {
      console.error("Error creating group:", error)
      setError("Failed to create group. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="group-name">Group Name</Label>
        <Input
          id="group-name"
          placeholder="Enter a name for your group"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="invite-email">Invite Members</Label>
        <div className="flex gap-2">
          <Input
            id="invite-email"
            placeholder="Enter email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddMember()
              }
            }}
          />
          <Button type="button" onClick={handleAddMember} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </div>
      
      {invitedMembers.length > 0 && (
        <div className="space-y-2">
          <Label>Invited Members</Label>
          <div className="flex flex-wrap gap-2">
            {invitedMembers.map((email) => (
              <Badge key={email} variant="secondary" className="flex items-center gap-1">
                {email}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveMember(email)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <Card className="bg-muted/50 p-4 flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm">
          <p className="font-medium">Group Pet Mode</p>
          <p className="text-muted-foreground">Your group will share a pet that you'll need to keep healthy by achieving your goals together.</p>
        </div>
      </Card>
      
      <Button 
        onClick={handleCreateGroup} 
        disabled={isCreating || !groupName.trim()}
        className="w-full"
      >
        {isCreating ? "Creating Group..." : "Create Group"}
      </Button>
    </div>
  )
}
