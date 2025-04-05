import { Sparkles } from "lucide-react"

interface AiInsightsProps {
  goalId?: string
}

export function AiInsights({ goalId }: AiInsightsProps) {
  // In a real app, you would fetch AI insights from your API based on the goal ID
  // For now, we'll use mock data

  const insights = [
    {
      id: "1",
      text: "You're making good progress on your guitar learning goal! Based on similar users, you're ahead of schedule by about 5%. Keep up the good work!",
      type: "progress",
    },
    {
      id: "2",
      text: "I notice you haven't submitted progress for your 'Learn basic chords' milestone yet. Consider breaking this down into smaller tasks to make it more manageable.",
      type: "suggestion",
    },
    {
      id: "3",
      text: "Your pet's health is at 85%. Complete your next milestone on time to keep it healthy and growing!",
      type: "pet",
    },
  ]

  // Filter insights by goal ID if provided
  const filteredInsights = goalId ? insights.filter((i) => i.id === goalId) : insights

  return (
    <div className="space-y-4">
      {filteredInsights.map((insight, index) => (
        <div key={index} className="flex gap-3 rounded-lg border p-4">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm">{insight.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

