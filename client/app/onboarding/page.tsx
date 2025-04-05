"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Check, Coins, Egg } from "lucide-react"
import { OnboardingProgress } from "@/components/onboarding-progress"
import { PetSelection } from "@/components/pet-selection"
import { MoneyStake } from "@/components/money-stake"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState("solo")
  const [stakeType, setStakeType] = useState("pet")
  const [selectedPet, setSelectedPet] = useState("dragon")
  const [stakeAmount, setStakeAmount] = useState(10)

  const totalSteps = 4

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Complete onboarding
      router.push("/dashboard")
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to GoalKeeper</CardTitle>
          <CardDescription>Let's get you set up in a few quick steps</CardDescription>
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Choose your account type</h3>
              <RadioGroup
                defaultValue={accountType}
                onValueChange={setAccountType}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="solo" id="solo" className="peer sr-only" />
                  <Label
                    htmlFor="solo"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="text-lg font-medium">Solo</span>
                    <span className="text-sm text-muted-foreground">Track your goals individually</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="group" id="group" className="peer sr-only" />
                  <Label
                    htmlFor="group"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="text-lg font-medium">Group</span>
                    <span className="text-sm text-muted-foreground">Track goals with friends</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Create your first goal</h3>
              <div className="space-y-2">
                <Label htmlFor="goal">What do you want to achieve?</Label>
                <Input id="goal" placeholder="e.g., Learn to play guitar in 3 months" />
                <p className="text-sm text-muted-foreground">Our AI will help break this down into milestones</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Choose your stake type</h3>
              <Tabs defaultValue={stakeType} onValueChange={setStakeType}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pet" className="flex items-center gap-2">
                    <Egg className="h-4 w-4" />
                    Pet Mode
                  </TabsTrigger>
                  <TabsTrigger value="money" className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Stake Mode
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pet" className="pt-4">
                  <PetSelection selectedPet={selectedPet} onSelectPet={setSelectedPet} />
                </TabsContent>
                <TabsContent value="money" className="pt-4">
                  <MoneyStake amount={stakeAmount} onAmountChange={setStakeAmount} />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="rounded-full bg-primary/10 p-4 mx-auto w-fit">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">You're all set!</h3>
              <p className="text-muted-foreground">
                Your account has been created and your first goal is ready to go. Let's head to your dashboard to start
                tracking your progress.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          ) : (
            <div></div>
          )}
          <Button onClick={handleNext}>
            {step < totalSteps ? (
              <>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Go to Dashboard"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

