"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { getRecentMessagesByGroupId, createMessage, createSystemMessage } from "@/app/actions/message"
import { getGroupById } from "@/app/actions/group"
import { getUserByEmail } from "@/app/actions/user"
import { getGroupTicks, getUserTicksInGroup } from "@/app/actions/tick"
import { generateResponseWithContext, generateResponseWithTextContext } from "@/lib/gemini"
import { AddTickDialog } from "@/components/add-tick-dialog"
import { Send, Bot, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Message {
  id: string
  content: string
  userId: string | null
  createdAt: Date
  userName?: string
}

interface ChatInterfaceProps {
  groupId: string
  userId: string
}

interface GroupMember {
  email: string
  name: string
}

interface Tick {
  id?: string;
  content: string;
  addedBy: string;
  timestamp: string;
  groupId?: string;
}

export function ChatInterface({ groupId, userId }: ChatInterfaceProps) {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [groupTicks, setGroupTicks] = useState<{[userEmail: string]: Tick[]}>({})
  const [groupName, setGroupName] = useState("")
  const [ticksUpdated, setTicksUpdated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Fetch messages and group info
  useEffect(() => {
    async function fetchData() {
      if (!groupId) return
      
      setIsLoading(true)
      try {
        // Fetch group details
        const group = await getGroupById(groupId)
        if (group) {
          setGroupName(group.name)
          
          // Parse members and fetch user details for each
          const memberEmails = JSON.parse(group.members)
          const memberDetails: GroupMember[] = []
          
          for (const email of memberEmails) {
            try {
              const userDetails = await getUserByEmail(email)
              memberDetails.push({
                email,
                name: userDetails?.name || email
              })
            } catch (error) {
              memberDetails.push({ email, name: email })
            }
          }
          
          setGroupMembers(memberDetails)
        }
        
        // Fetch messages
        const fetchedMessages = await getRecentMessagesByGroupId(groupId)
        
        // Transform messages for display
        const formattedMessages = fetchedMessages.map(msg => ({
          id: msg._id,
          content: msg.content,
          userId: msg.userId,
          createdAt: new Date(msg.createdAt),
          userName: msg.userId ? 
            groupMembers.find(m => m.email === msg.userId)?.name || "User" : 
            "Gemini Assistant"
        }))
        
        setMessages(formattedMessages)
        
        // Fetch group ticks
        const ticks = await fetchGroupTicks()
        console.log(ticks)
        
        // If no messages, send a welcome message from Gemini
        if (formattedMessages.length === 0) {
          sendGeminiWelcomeMessage()
        }
      } catch (error) {
        console.error("Error fetching chat data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
    
    // Set up polling for new messages
    const intervalId = setInterval(() => {
      fetchNewMessages()
    }, 5000)
    
    return () => clearInterval(intervalId)
  }, [groupId])
  
  // Update when ticks are added
  useEffect(() => {
    if (ticksUpdated) {
      fetchGroupTicks()
      setTicksUpdated(false)
    }
  }, [ticksUpdated, groupId])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const fetchNewMessages = async () => {
    if (!groupId) return
    
    try {
      const fetchedMessages = await getRecentMessagesByGroupId(groupId)
      
      // Only update if there are new messages
      if (fetchedMessages.length > messages.length) {
        const formattedMessages = fetchedMessages.map(msg => ({
          id: msg._id,
          content: msg.content,
          userId: msg.userId,
          createdAt: new Date(msg.createdAt),
          userName: msg.userId ? "User" : "Gemini Assistant"
        }))
        
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error("Error fetching new messages:", error)
    }
  }
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !groupId || !userId) return
    
    setIsSending(true)
    try {
      // Send user message
      await createMessage({
        groupId,
        userId,
        content: newMessage
      })
      
      // Clear input
      setNewMessage("")
      
      // Refresh messages
      await fetchNewMessages()
      
      // Trigger Gemini response
      setTimeout(() => {
        sendGeminiResponse(newMessage)
      }, 1000)
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }
  
  const sendGeminiWelcomeMessage = async () => {
    try {
      // Get the current group to check roast level
      const group = await getGroupById(groupId);
      const roastLevel = group?.geminiRoastLevel || 5; // Default to 5 if not set
      
      // Adjust welcome message based on roast level
      let roastDescription = "";
      if (roastLevel <= 2) {
        roastDescription = "gentle and supportive";
      } else if (roastLevel <= 4) {
        roastDescription = "mildly playful";
      } else if (roastLevel <= 6) {
        roastDescription = "moderately spicy";
      } else if (roastLevel <= 8) {
        roastDescription = "quite spicy";
      } else {
        roastDescription = "absolutely savage";
      }
      
      // Generate a welcome message
      const welcomeMessage = `Hello and welcome to the ${groupName} team chat! 👋\n\nI'm your Gemini assistant, and I'm here to help make your team communication more fun and engaging. I can provide information, answer questions, and even roast team members in a ${roastDescription} way based on their behavior (all in good fun, of course!).\n\nYour team's current roast level is set to ${roastLevel}/10. You can adjust this in the Team Settings.\n\nFeel free to chat with me anytime. What would you like to talk about today?`
      
      // Send the welcome message
      await createSystemMessage(groupId, welcomeMessage)
      
      // Refresh messages
      await fetchNewMessages()
    } catch (error) {
      console.error("Error sending welcome message:", error)
    }
  }
  
  async function fetchGroupTicks() {
    try {
      const allGroupTicks = await getGroupTicks(groupId)
      console.log(allGroupTicks)
      
      // Organize ticks by user
      const ticksByUser: {[userEmail: string]: Tick[]} = {}
      
      allGroupTicks.forEach(userTicks => {
        ticksByUser[userTicks.userEmail] = userTicks.ticks
      })
      
      // If we have group members but no ticks for them, initialize empty arrays
      groupMembers.forEach(member => {
        if (!ticksByUser[member.email]) {
          ticksByUser[member.email] = [];
        }
      });
      
      setGroupTicks(ticksByUser)
      setTicksUpdated(false)
    } catch (error) {
      console.error("Error fetching group ticks:", error)
    }
  }

  async function sendGeminiResponse(userMessage: string) {
    try {
      // Get the current group to check roast level
      const group = await getGroupById(groupId);
      const roastLevel = group?.geminiRoastLevel || 5; // Default to 5 if not set
      
      // Prepare context from ticks
      let tickContext = "";
      
      // Add roast level context
      tickContext += `Roast level: ${roastLevel}/10. `;
      
      if (roastLevel <= 2) {
        tickContext += "Be very gentle and supportive in your responses. Avoid any criticism.\n\n";
      } else if (roastLevel <= 4) {
        tickContext += "Be mostly supportive with occasional light teasing. Keep criticism constructive and mild.\n\n";
      } else if (roastLevel <= 6) {
        tickContext += "Balance support with moderate roasting. You can point out flaws in a humorous way.\n\n";
      } else if (roastLevel <= 8) {
        tickContext += "Be more direct with roasts while maintaining some tact. Don't hold back too much.\n\n";
      } else {
        tickContext += "Go all out with savage roasts. Be brutally honest but still funny.\n\n";
      }
      
      // Format the ticks for each user
      Object.entries(groupTicks).forEach(([userEmail, ticks]) => {
        const member = groupMembers.find(m => m.email === userEmail);
        const userName = member?.name || userEmail;
        
        if (ticks.length > 0) {
          tickContext += `Observations about ${userName}:\n`;
          ticks.forEach(tick => {
            tickContext += `- ${tick.content}\n`;
          });
          tickContext += "\n";
        }
      });
      
      // Generate response from Gemini
      const geminiResponse = await generateResponseWithTextContext(
        userMessage,
        tickContext,
        groupName
      )
      
      // Send Gemini's response
      await createSystemMessage(groupId, geminiResponse)
      
      // Refresh messages
      await fetchNewMessages()
    } catch (error) {
      console.error("Error sending Gemini response:", error)
      // Send a fallback message if there's an error
      await createSystemMessage(groupId, "I'm sorry, I encountered an error while processing your request. Please try again later.")
      await fetchNewMessages()
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }
  
  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h2 className="font-semibold">{groupName || "Chat"}</h2>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[400px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.userId === userId ? "justify-end" : ""
                }`}
              >
                {message.userId !== userId && (
                  <Avatar>
                    {message.userId ? (
                      <AvatarImage src={user?.picture || ""} alt={message.userName} />
                    ) : (
                      <AvatarImage src="/gemini.png" alt="Gemini" />
                    )}
                    <AvatarFallback>
                      {message.userId ? getInitials(message.userName || "User") : <Bot className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[80%] ${message.userId === userId ? "order-first" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {message.userId === userId
                        ? "You"
                        : message.userId
                        ? message.userName
                        : "Gemini Assistant"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  <div
                    className={`mt-1 rounded-lg p-3 ${
                      message.userId === userId
                        ? "bg-primary text-primary-foreground"
                        : message.userId
                        ? "bg-muted"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
                
                {message.userId === userId && (
                  <Avatar>
                    <AvatarImage src={user?.picture || ""} alt="You" />
                    <AvatarFallback>{getInitials(user?.name || "You")}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <AddTickDialog 
            groupId={groupId}
            currentUserEmail={userId}
            groupMembers={groupMembers}
            onTickAdded={() => setTicksUpdated(true)}
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Add observations about group members to help Gemini provide more personalized responses.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSending || isLoading}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={isSending || isLoading || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
