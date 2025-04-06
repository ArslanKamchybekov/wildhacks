import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import RoastLevelControl from "@/components/team/RoastLevelControl"
import MemberManagement from "@/components/team/MemberManagement"
import GroupInfoEditor from "@/components/team/GroupInfoEditor"
import UserTicksManager from "@/components/team/UserTicksManager"

interface GroupDetails {
  id: string
  name: string
  description: string
  members: string[]
  geminiRoastLevel: number
  createdBy: string
}

interface TeamSettingsPanelProps {
  selectedGroup: GroupDetails
  currentUserEmail: string
  refreshGroupData: () => Promise<void>
}

export function TeamSettingsPanel({ selectedGroup, currentUserEmail, refreshGroupData }: TeamSettingsPanelProps) {
  const isCreator = currentUserEmail === selectedGroup.createdBy

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Team Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <GroupInfoEditor
            groupId={selectedGroup.id}
            name={selectedGroup.name}
            description={selectedGroup.description}
            isCreator={isCreator}
            onInfoChange={refreshGroupData}
          />

          <hr className="my-4" />

          <RoastLevelControl groupId={selectedGroup.id} initialLevel={selectedGroup.geminiRoastLevel} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberManagement
            groupId={selectedGroup.id}
            members={selectedGroup.members}
            currentUserEmail={currentUserEmail}
            isCreator={isCreator}
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
          <UserTicksManager groupMembers={selectedGroup.members} currentUserEmail={currentUserEmail} />
        </CardContent>
      </Card>
    </div>
  )
}

