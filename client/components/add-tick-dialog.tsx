"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { addTickToUser } from "@/app/actions/tick"
import { PlusCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface AddTickDialogProps {
  groupId: string
  currentUserEmail: string
  groupMembers: Array<{ email: string; name: string }>
  onTickAdded: () => void
}

export function AddTickDialog({ groupId, currentUserEmail, groupMembers, onTickAdded }: AddTickDialogProps) {
  const [selectedUser, setSelectedUser] = useState("")
  const [tickContent, setTickContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  const handleSubmit = async () => {
    if (!selectedUser || !tickContent.trim()) return
    
    setIsSubmitting(true)
    try {
      const result = await addTickToUser(
        selectedUser,
        currentUserEmail,
        groupId,
        tickContent
      )
      
      if (result.success) {
        toast({
          title: "Tick added",
          description: `Your observation about ${selectedUser} has been added.`,
        })
        setTickContent("")
        setSelectedUser("")
        setIsOpen(false)
        onTickAdded()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add tick. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Tick
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Group Member Tick</DialogTitle>
          <DialogDescription>
            Add an observation about a group member. These observations help Gemini understand the group dynamics and provide more personalized responses.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="user-select" className="text-sm font-medium">
              Group Member
            </label>
            <Select
              value={selectedUser}
              onValueChange={setSelectedUser}
            >
              <SelectTrigger id="user-select">
                <SelectValue placeholder="Select a group member" />
              </SelectTrigger>
              <SelectContent>
                {groupMembers
                  .map(member => (
                    <SelectItem key={member.email} value={member.email}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="tick-content" className="text-sm font-medium">
              Observation
            </label>
            <Textarea
              id="tick-content"
              placeholder="e.g., 'Has been consistently meeting their workout goals'"
              value={tickContent}
              onChange={(e) => setTickContent(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Keep observations constructive and helpful. They will be visible to Gemini and may be referenced in the chat.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting || !selectedUser || !tickContent.trim()}>
            {isSubmitting ? "Adding..." : "Add Tick"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
