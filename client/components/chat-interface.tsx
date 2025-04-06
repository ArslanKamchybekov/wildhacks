"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { getRecentMessagesByGroupId, createMessage, createSystemMessage } from "@/app/actions/message"
import { getGroupById } from "@/app/actions/group"
import { getUserByEmail, getUserById } from "@/app/actions/user"
import { getGroupTicks } from "@/app/actions/tick"
import { generateResponseWithTextContext } from "@/lib/gemini"
import { AddTickDialog } from "@/components/add-tick-dialog"
import { Send, Bot, Info, PlusCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

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
  id?: string
  content: string
  addedBy: string
  timestamp: string
  groupId?: string
}

export function ChatInterface({ groupId, userId }: ChatInterfaceProps) {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isGeminiLoading, setIsGeminiLoading] = useState(false)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [groupTicks, setGroupTicks] = useState<{ [userEmail: string]: Tick[] }>({})
  const [groupName, setGroupName] = useState("")
  const [ticksUpdated, setTicksUpdated] = useState(false)
  const [textareaHeight, setTextareaHeight] = useState("40px")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
                name: userDetails?.name || email,
              })
            } catch (error) {
              memberDetails.push({ email, name: email })
            }
          }

          setGroupMembers(memberDetails)
        }

        // Fetch messages
        const fetchedMessages = await getRecentMessagesByGroupId(groupId)

        // Transform messages for display with proper user names
        const formattedMessages = await Promise.all(
          fetchedMessages.map(async (msg) => {
            let userName = "Gemini Assistant"
            if (msg.userId) {
              const userObj = await getUserById(msg.userId)
              userName = userObj?.name || msg.userId
            }

            return {
              id: msg._id,
              content: msg.content,
              userId: msg.userId,
              createdAt: new Date(msg.createdAt),
              userName,
            }
          }),
        )

        setMessages(formattedMessages)

        // Fetch group ticks
        await fetchGroupTicks()

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

  const fetchNewMessages = async () => {
    if (!groupId) return

    try {
      const fetchedMessages = await getRecentMessagesByGroupId(groupId)

      // Only update if there are new messages
      if (fetchedMessages.length > messages.length) {
        // Create formatted messages with proper user names
        const formattedMessages = await Promise.all(
          fetchedMessages.map(async (msg) => {
            let userName = "Gemini Assistant"

            if (msg.userId) {
              const userObj = await getUserById(msg.userId)
              userName = userObj?.name || msg.userId
            }

            return {
              id: msg._id,
              content: msg.content,
              userId: msg.userId,
              createdAt: new Date(msg.createdAt),
              userName,
            }
          }),
        )

        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error("Error fetching new messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !groupId || !userId) return

    const isGeminiMention = newMessage.trim().startsWith('@Gemini')
    const messageToSend = isGeminiMention 
      ? newMessage.trim() 
      : newMessage // Don't modify message if not mentioning Gemini

    setIsSending(true)
    try {
      // Send user message
      await createMessage({
        groupId,
        userId,
        content: messageToSend,
      })

      // Clear input
      setNewMessage("")
      setTextareaHeight("40px")

      // Refresh messages
      await fetchNewMessages()

      // Only trigger Gemini response if message starts with @Gemini
      if (isGeminiMention) {
        // Remove @Gemini from the message before sending to the AI
        const cleanMessage = messageToSend.replace(/^@Gemini\s*/i, '')
        sendGeminiResponse(cleanMessage)
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const sendGeminiWelcomeMessage = async () => {
    try {
      // Get the current group to check roast level
      const group = await getGroupById(groupId)
      const roastLevel = group?.geminiRoastLevel || 5 // Default to 5 if not set

      // Adjust welcome message based on roast level
      let roastDescription = ""
      if (roastLevel <= 2) {
        roastDescription = "gentle and supportive"
      } else if (roastLevel <= 4) {
        roastDescription = "mildly playful"
      } else if (roastLevel <= 6) {
        roastDescription = "moderately spicy"
      } else if (roastLevel <= 8) {
        roastDescription = "quite spicy"
      } else {
        roastDescription = "absolutely savage"
      }

      // Generate a welcome message
      const welcomeMessage = `# Hello and welcome to the ${groupName} team chat! 👋

I'm your Gemini assistant, and I'm here to help make your team communication more fun and engaging. I can provide information, answer questions, and even roast team members in a ${roastDescription} way based on their behavior (all in good fun, of course!).

Your team's current roast level is set to **${roastLevel}/10**. You can adjust this in the Team Settings.

Feel free to chat with me anytime. What would you like to talk about today?`

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

      // Organize ticks by user
      const ticksByUser: { [userEmail: string]: Tick[] } = {}

      allGroupTicks.forEach((userTicks) => {
        ticksByUser[userTicks.userEmail] = userTicks.ticks
      })

      // If we have group members but no ticks for them, initialize empty arrays
      groupMembers.forEach((member) => {
        if (!ticksByUser[member.email]) {
          ticksByUser[member.email] = []
        }
      })

      setGroupTicks(ticksByUser)
      setTicksUpdated(false)
    } catch (error) {
      console.error("Error fetching group ticks:", error)
    }
  }

  async function sendGeminiResponse(userMessage: string) {
    setIsGeminiLoading(true)
    try {
      // Get the current group to check roast level
      const group = await getGroupById(groupId)
      const roastLevel = group?.geminiRoastLevel || 5 // Default to 5 if not set

      // Prepare context from ticks
      let tickContext = ""

      // Add roast level context
      tickContext += `Roast level: ${roastLevel}/10. `

      if (roastLevel <= 2) {
        tickContext += "Be very gentle and supportive in your responses. Avoid any criticism.\n\n"
      } else if (roastLevel <= 4) {
        tickContext += "Be mostly supportive with occasional light teasing. Keep criticism constructive and mild.\n\n"
      } else if (roastLevel <= 6) {
        tickContext += "Balance support with moderate roasting. You can point out flaws in a humorous way.\n\n"
      } else if (roastLevel <= 8) {
        tickContext += "Be more direct with roasts while maintaining some tact. Don't hold back too much.\n\n"
      } else {
        tickContext += "Go all out with savage roasts. Be brutally honest but still funny.\n\n"
      }

      // Format the ticks for each user
      Object.entries(groupTicks).forEach(([userEmail, ticks]) => {
        const member = groupMembers.find((m) => m.email === userEmail)
        const userName = member?.name || userEmail

        if (ticks.length > 0) {
          tickContext += `Observations about ${userName}:\n`
          ticks.forEach((tick) => {
            tickContext += `- ${tick.content}\n`
          })
          tickContext += "\n"
        }
      })

      // Add instructions to use markdown
      tickContext +=
        "\nFormat your responses using Markdown. You can use headings, bold, italic, lists, code blocks, etc. to make your responses more readable and engaging.\n"

      // Generate response from Gemini
      const geminiResponse = await generateResponseWithTextContext(userMessage, tickContext, groupName)

      // Send Gemini's response
      await createSystemMessage(groupId, geminiResponse)

      // Refresh messages
      await fetchNewMessages()
    } catch (error) {
      console.error("Error sending Gemini response:", error)
      // Send a fallback message if there's an error
      await createSystemMessage(
        groupId,
        "I'm sorry, I encountered an error while processing your request. Please try again later.",
      )
      await fetchNewMessages()
    } finally {
      setIsGeminiLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = scrollHeight + "px"
      setTextareaHeight(scrollHeight + "px")
    }
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg shadow-sm bg-background">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <h2 className="font-semibold text-lg">{groupName || "Chat"}</h2>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Info className="h-4 w-4 mr-1" />
                  <span className="text-xs">About</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>This chat uses Gemini AI to provide responses. Start your message with <strong>@Gemini</strong> to get an AI response.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" style={{ height: "500px", overflow: "auto" }}>
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
                className={`flex items-start gap-3 ${message.userId === userId ? "justify-end" : ""}`}
              >
                {message.userId !== userId && (
                  <Avatar className="h-10 w-10 border">
                    {message.userId ? (
                      <AvatarImage src={user?.picture || ""} alt={message.userName} />
                    ) : (
                      <AvatarImage src="/gemini.png" alt="Gemini" />
                    )}
                    <AvatarFallback>
                      {message.userId ? message.userName?.[0] || "U" : <Bot className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[80%] ${message.userId === userId ? "order-first" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {message.userId === userId ? "You" : message.userId ? message.userName : "Gemini"}
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
                          : "bg-accent/20 border"
                    }`}
                  >
                    <div className="markdown-content prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "")
                            return match ? (
                              <code className={className} {...props}>
                                {String(children).replace(/\n$/, "")}
                              </code>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          },
                          // Override other elements as needed
                          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-2 mb-1" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-2 mb-1" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-md font-bold mt-2 mb-1" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-1" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-1" {...props} />,
                          li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                          a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" {...props} />,
                          blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-4 border-gray-300 pl-2 italic" {...props} />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

                {message.userId === userId && (
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={user?.picture || ""} alt="You" />
                    <AvatarFallback>{user?.name?.[0] || "Y"}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {/* Gemini loading indicator */}
            {isGeminiLoading && (
              <div className="flex items-start gap-3 animate-pulse">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src="/gemini.png" alt="Gemini" />
                  <AvatarFallback>
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Gemini</span>
                    <span className="text-xs text-muted-foreground">typing...</span>
                  </div>
                  <div className="mt-1 rounded-lg p-3 bg-accent/20 border">
                    <div className="flex space-x-2 items-center">
                      <div className="h-2 w-2 rounded-full bg-current animate-bounce"></div>
                      <div className="h-2 w-2 rounded-full bg-current animate-bounce delay-75"></div>
                      <div className="h-2 w-2 rounded-full bg-current animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
        </div>
        <div className="flex items-start gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              placeholder="Type your message... (Shift+Enter for new line)"
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyPress}
              disabled={isSending || isLoading}
              className="w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ height: textareaHeight, maxHeight: "150px" }}
              rows={1}
            />
            <div className="absolute bottom-1 right-2 text-xs text-muted-foreground pointer-events-none">
              {newMessage.length > 0 && (
                newMessage.trim().startsWith('@Gemini') 
                  ? <span className="text-primary">Gemini will respond</span>
                  : "Use @Gemini to get AI response"
              )}
            </div>
          </div>
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={isSending || isLoading || !newMessage.trim()}
            className="h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

