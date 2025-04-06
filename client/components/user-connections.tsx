"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Mail, Plus, Trash2, Edit } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { 
  createUserConnection, 
  deleteUserConnection, 
  getUserConnections, 
  updateUserConnection 
} from "@/app/actions/user-connection"

interface UserConnectionsProps {
  userId: string
}

interface Connection {
  _id: string
  userId: string
  email: string
  connectionLabel: string
  createdAt: Date
  updatedAt: Date
}

// Form validation schema
const connectionFormSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .max(100, { message: "Email must not exceed 100 characters" }),
  connectionLabel: z
    .string()
    .min(1, { message: "Label is required" })
    .max(50, { message: "Label must not exceed 50 characters" })
})

export function UserConnections({ userId }: UserConnectionsProps) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  
  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof connectionFormSchema>>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      email: "",
      connectionLabel: ""
    }
  })
  
  // Load connections on component mount
  useEffect(() => {
    async function loadConnections() {
      if (!userId) return
      
      try {
        setIsLoading(true)
        const data = await getUserConnections(userId)
        setConnections(data)
      } catch (error) {
        console.error("Error loading connections:", error)
        toast({
          title: "Failed to load connections",
          description: "Please try again later",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadConnections()
  }, [userId, toast])
  
  // Handle form submission for adding or editing a connection
  async function onSubmit(values: z.infer<typeof connectionFormSchema>) {
    try {
      setIsSubmitting(true)
      
      if (editingConnection) {
        // Update existing connection
        const updated = await updateUserConnection(
          editingConnection._id,
          {
            email: values.email,
            connectionLabel: values.connectionLabel
          }
        )
        
        // Update connections list
        setConnections(prevConnections => 
          prevConnections.map(conn => 
            conn._id === editingConnection._id ? updated : conn
          )
        )
        
        toast({
          title: "Connection updated",
          description: `Updated ${values.connectionLabel}'s contact info`
        })
      } else {
        // Create new connection
        const newConnection = await createUserConnection({
          userId,
          email: values.email,
          connectionLabel: values.connectionLabel
        })
        
        // Add to connections list
        setConnections(prev => [newConnection, ...prev])
        
        toast({
          title: "Connection added",
          description: `Added ${values.connectionLabel} to your connections`
        })
      }
      
      // Reset form and close dialog
      form.reset()
      setDialogOpen(false)
      setEditingConnection(null)
    } catch (error) {
      console.error("Error saving connection:", error)
      toast({
        title: "Failed to save connection",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle deleting a connection
  async function handleDeleteConnection(connectionId: string) {
    if (!confirm("Are you sure you want to delete this connection?")) return
    
    try {
      await deleteUserConnection(connectionId)
      
      // Remove from connections list
      setConnections(prev => 
        prev.filter(conn => conn._id !== connectionId)
      )
      
      toast({
        title: "Connection deleted",
        description: "The connection has been removed"
      })
    } catch (error) {
      console.error("Error deleting connection:", error)
      toast({
        title: "Failed to delete connection",
        description: "Please try again later",
        variant: "destructive"
      })
    }
  }
  
  // Handle editing a connection
  function handleEditConnection(connection: Connection) {
    setEditingConnection(connection)
    
    // Set form values from the connection being edited
    form.setValue('email', connection.email)
    form.setValue('connectionLabel', connection.connectionLabel)
    
    // Open dialog
    setDialogOpen(true)
  }
  
  // Reset form when dialog opens (for new connections)
  function handleOpenChange(open: boolean) {
    setDialogOpen(open)
    
    if (!open) {
      // Reset form when dialog closes
      form.reset()
      setEditingConnection(null)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Contact Connections</h3>
              </div>
          <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="ml-auto">
                <Plus className="h-4 w-4 mr-2" /> Add Connection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingConnection ? "Edit Connection" : "Add New Connection"}
                </DialogTitle>
                <DialogDescription>
                  {editingConnection 
                    ? "Update the contact information for this connection" 
                    : "Add someone who can be notified when you're not being productive"}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="connectionLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Mom, Dad, Mentor..." {...field} />
                        </FormControl>
                        <FormDescription>
                          A label to identify this contact
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="person@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Email where notifications will be sent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting 
                        ? "Saving..." 
                        : editingConnection ? "Update Connection" : "Add Connection"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Add email addresses that can be notified when you're not being productive
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading connections...
          </div>
        ) : connections.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No connections added yet. Add email addresses that can be notified when you're slacking off.
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map(connection => (
              <div 
                key={connection._id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div>
                  <h4 className="font-medium">{connection.connectionLabel}</h4>
                  <p className="text-sm text-muted-foreground">{connection.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEditConnection(connection)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteConnection(connection._id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
