"use client"

import { useEffect, useState } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { DashboardShell } from "@/components/dashboard-shell"
import { ChatInterface } from "@/components/chat-interface"
import { getGroupsByMember, getGroupById } from "@/app/actions/group"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Heart, Settings, ChevronDown, ChevronUp } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import PetWidget from "@/components/pet/PetWidget"
import { TeamSettingsPanel } from "./_components/team-settings-panel"
import { TeamHeader } from "./_components/team-header"
import { SelectTeamPrompt } from "./_components/select-team-prompt"
import NotFound from "@/components/ui/notfound"
import { Spinner } from "@/components/ui/spinner"

// Define types for better code organization
interface Group {
  id: string
  name: string
  description: string
}

interface GroupDetails extends Group {
  members: string[]
  geminiRoastLevel: number
  createdBy: string
}

export default function TeamPage() {
  const { user, isLoading: authLoading } = useUser()
  const { user: dbUser, isLoading: dbLoading } = useCurrentUser()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<GroupDetails | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const isLoading = authLoading || dbLoading || isLoadingGroups

  // Load user's groups
  useEffect(() => {
    async function loadGroups() {
      if (!user?.email) return

      try {
        setIsLoadingGroups(true)
        const userGroups = await getGroupsByMember(user.email)

        setGroups(
          userGroups.map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description,
          })),
        )

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

    if (user && !authLoading) {
      loadGroups()
    }
  }, [user, authLoading, selectedGroupId])

  // Load detailed group info when a group is selected
  useEffect(() => {
    loadGroupDetails()
  }, [selectedGroupId])

  const loadGroupDetails = async () => {
    if (!selectedGroupId) {
      setSelectedGroup(null)
      return
    }

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
          createdBy: groupDetails.createdBy,
        })
      }
    } catch (error) {
      console.error("Error loading group details:", error)
      setSelectedGroup(null)
    }
  }

  const handleGroupChange = (value: string) => {
    setSelectedGroupId(value)
    setShowSettings(false)
  }

  const refreshGroupData = async () => {
    // Refresh group details
    await loadGroupDetails()

    // Also refresh the groups list
    if (user?.email) {
      try {
        const userGroups = await getGroupsByMember(user.email)
        setGroups(
          userGroups.map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description,
          })),
        )
      } catch (error) {
        console.error("Error refreshing groups list:", error)
      }
    }
  }


  // Render appropriate content based on state
  const renderContent = () => {
    if (isLoading) {
      return <Spinner />
    }

    if (groups.length === 0) {
      return <NotFound message="No teams found" />
    }

    if (!selectedGroupId || !selectedGroup) {
      return <SelectTeamPrompt />
    }

    return (
      <div className="space-y-6">
        {/* Team Settings Panel - Top level */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Team Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TeamSettingsPanel
              selectedGroup={selectedGroup}
              currentUserEmail={user?.email || ""}
              refreshGroupData={refreshGroupData}
            />
          </CardContent>
        </Card>
        
        {/* Pet Widget and Chat side by side */}
        <div className="grid grid-cols-12 gap-6">
          {/* Team Pet Widget */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="w-full flex justify-center items-center">
              <PetWidget groupId={selectedGroupId} />
            </div>
          </div>
          
          {/* Chat Interface - Side by side with pet */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9">
            <ChatInterface groupId={selectedGroupId} userId={dbUser?._id} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardShell>
      <div className="flex flex-col space-y-4">
        <TeamHeader
          title="Team Space"
          groups={groups}
          selectedGroupId={selectedGroupId}
          onGroupChange={handleGroupChange}
        />

        {renderContent()}
      </div>
    </DashboardShell>
  )
}

