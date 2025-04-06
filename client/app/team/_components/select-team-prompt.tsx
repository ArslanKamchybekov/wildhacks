import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SelectTeamPrompt() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Team</CardTitle>
        <CardDescription>Please select a team from the dropdown above to access your team space.</CardDescription>
      </CardHeader>
    </Card>
  )
}

