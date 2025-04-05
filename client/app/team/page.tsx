"use client"

import { useEffect, useState } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { DashboardShell } from "@/components/dashboard-shell"
import { ChatInterface } from "@/components/chat-interface"
import { getGroupsByMember, getGroupById } from "@/app/actions/group"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Users, Heart, Settings, ChevronDown, ChevronUp } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import PetWidget from "@/components/pet/PetWidget"
import RoastLevelControl from "@/components/team/RoastLevelControl"
import MemberManagement from "@/components/team/MemberManagement"
import GroupInfoEditor from "@/components/team/GroupInfoEditor"
import UserTicksManager from "@/components/team/UserTicksManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TeamPage() {
  const { user, isLoading } = useUser()
  const [groups, setGroups] = useState<{ id: string; name: string; description: string }[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<{
    id: string;
    name: string;
    description: string;
    members: string[];
    geminiRoastLevel: number;
    createdBy: string;
  } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const { user: dbUser, isLoading: dbLoading, error: dbError } = useCurrentUser();

  useEffect(() => {
    async function loadGroups() {
      if (user?.email) {
        try {
          setIsLoadingGroups(true)
          const userGroups = await getGroupsByMember(user.email)
          setGroups(userGroups.map(group => ({ 
            id: group.id, 
            name: group.name,
            description: group.description
          })))
          
          // Select the first group by default if available
          if (userGroups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(userGroups[0].id)
          }
        } catch (error) {
          console.error("Error loading groups:", error)
        } finally {
          setIsLoadingGroups(false)
        }
      }
    }

    if (user && !isLoading) {
      loadGroups()
    }
  }, [user, isLoading, selectedGroupId])
  
  // Load detailed group info when a group is selected
  useEffect(() => {
    async function loadGroupDetails() {
      if (selectedGroupId) {
        try {
          const groupDetails = await getGroupById(selectedGroupId)
          if (groupDetails) {
            // Parse the members JSON string
            const membersArray = JSON.parse(groupDetails.members)
            
            setSelectedGroup({
              id: groupDetails.id,
              name: groupDetails.name,
              description: groupDetails.description,
              members: membersArray,
              geminiRoastLevel: groupDetails.geminiRoastLevel,
              createdBy: groupDetails.createdBy
            })
          }
        } catch (error) {
          console.error("Error loading group details:", error)
          setSelectedGroup(null)
        }
      } else {
        setSelectedGroup(null)
      }
    }
    
    loadGroupDetails()
  }, [selectedGroupId])

  const handleGroupChange = (value: string) => {
    setSelectedGroupId(value)
    setShowSettings(false)
  }
  
  const refreshGroupData = async () => {
    if (selectedGroupId) {
      try {
        const groupDetails = await getGroupById(selectedGroupId)
        if (groupDetails) {
          // Parse the members JSON string
          const membersArray = JSON.parse(groupDetails.members)
          
          setSelectedGroup({
            id: groupDetails.id,
            name: groupDetails.name,
            description: groupDetails.description,
            members: membersArray,
            geminiRoastLevel: groupDetails.geminiRoastLevel,
            createdBy: groupDetails.createdBy
          })
          
          // Also refresh the groups list
          if (user?.email) {
            const userGroups = await getGroupsByMember(user.email)
            setGroups(userGroups.map(group => ({ 
              id: group.id, 
              name: group.name,
              description: group.description
            })))
          }
        }
      } catch (error) {
        console.error("Error refreshing group data:", error)
      }
    }
  }

  return (
    <DashboardShell>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Team Space</h1>
          {groups.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <Select value={selectedGroupId} onValueChange={handleGroupChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isLoading || isLoadingGroups ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>No Teams Found</span>
              </CardTitle>
              <CardDescription>
                You need to be part of a team to access this page. Create or join a team to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = "/onboarding"}>
                Create a Team
              </Button>
            </CardContent>
          </Card>
        ) : selectedGroupId && selectedGroup ? (
          <div className="space-y-4">
            {/* Team Settings Toggle */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
                <span>Team Settings</span>
                {showSettings ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Team Settings Panel */}
            {showSettings && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Team Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <GroupInfoEditor 
                      groupId={selectedGroupId}
                      name={selectedGroup.name}
                      description={selectedGroup.description}
                      isCreator={user?.email === selectedGroup.createdBy}
                      onInfoChange={refreshGroupData}
                    />
                    
                    <hr className="my-4" />
                    
                    <RoastLevelControl 
                      groupId={selectedGroupId}
                      initialLevel={selectedGroup.geminiRoastLevel}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MemberManagement 
                      groupId={selectedGroupId}
                      members={selectedGroup.members}
                      currentUserEmail={user?.email || ''}
                      isCreator={user?.email === selectedGroup.createdBy}
                      onMembersChange={refreshGroupData}
                    />
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Member Observations</CardTitle>
                    <CardDescription>
                      Add observations about team members to help Gemini generate more personalized roasts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UserTicksManager 
                      groupMembers={selectedGroup.members}
                      currentUserEmail={user?.email || ''}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Main Team Interface */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Team Pet Widget - Takes 1/4 of the space on desktop */}
              <div className="md:col-span-1">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Team Pet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PetWidget groupId={selectedGroupId} />
                  </CardContent>
                </Card>
              </div>
              
              {/* Chat Interface - Takes 3/4 of the space on desktop */}
              <div className="md:col-span-3">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Team Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChatInterface groupId={selectedGroupId} userId={dbUser._id} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Select a Team</CardTitle>
              <CardDescription>
                Please select a team from the dropdown above to access your team space.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
