import { Progress } from "@/components/ui/progress"

interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const progressPercentage = (currentStep / totalSteps) * 100

  return (
    <div className="space-y-2 mt-4">
      <div className="flex justify-between text-sm">
        <span>
          Step {currentStep} of {totalSteps}
        </span>
        <span>{Math.round(progressPercentage)}%</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  )
}

