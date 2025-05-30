"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Check, Coins, Egg, Users } from "lucide-react"
import { OnboardingProgress } from "@/components/onboarding-progress"
import { PetSelection } from "@/components/pet-selection"
import { MoneyStake } from "@/components/money-stake"
import { GroupCreation } from "@/components/group-creation"
import { useUser } from "@auth0/nextjs-auth0/client"

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState("solo")
  const [stakeType, setStakeType] = useState("pet")
  const [selectedPet, setSelectedPet] = useState("dragon")
  const [stakeAmount, setStakeAmount] = useState(10)
  const [groupId, setGroupId] = useState<string>("") 
  const [userId, setUserId] = useState<string>(user?.email || "temp-user-id")

  // Set up total steps state based on account type
  const [totalSteps, setTotalSteps] = useState(4)
  
  // Update step flow when account type changes
  useEffect(() => {
    if (accountType === "group") {
      setTotalSteps(5)
    } else {
      setTotalSteps(4)
    }
  }, [accountType])

  const handleNext = () => {
    if (step < totalSteps) {
      // If in group mode and moving from step 1 to 2, go to group creation
      if (accountType === "group" && step === 1) {
        setStep(2) // Group creation step
      } else {
        setStep(step + 1)
      }
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
    <div className="container mx-auto flex items-center justify-center min-h-screen py-8 px-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Waddl</CardTitle>
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

          {step === 2 && accountType === "group" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Create Your Group</h3>
              <GroupCreation 
                userId={userId} 
                onGroupCreated={(id) => {
                  setGroupId(id)
                  setStep(3) // Move to next step after group creation
                }} 
              />
            </div>
          )}

          {step === 2 && accountType === "solo" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Create your first goal</h3>
              <div className="space-y-2">
                <Label htmlFor="goal">What do you want to achieve?</Label>
                <Input id="goal" placeholder="e.g., Learn to play guitar in 3 months" />
                <p className="text-sm text-muted-foreground">Our AI will help break this down into milestones</p>
              </div>
            </div>
          )}

          {step === 3 && accountType === "group" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Create your group's first goal</h3>
              <div className="space-y-2">
                <Label htmlFor="group-goal">What does your group want to achieve?</Label>
                <Input id="group-goal" placeholder="e.g., Complete a fitness challenge together" />
                <p className="text-sm text-muted-foreground">Our AI will help break this down into milestones for your group</p>
              </div>
            </div>
          )}

          {step === 3 && accountType === "solo" && (
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

          {step === 4 && accountType === "group" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Choose your group pet</h3>
              <div className="text-sm text-muted-foreground mb-4">
                Your group will take care of this pet together. The pet's health depends on everyone achieving their goals.
              </div>
              <PetSelection selectedPet={selectedPet} onSelectPet={setSelectedPet} />
            </div>
          )}

          {step === 4 && accountType === "solo" && (
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

          {step === 5 && accountType === "group" && (
            <div className="space-y-4 text-center">
              <div className="rounded-full bg-primary/10 p-4 mx-auto w-fit">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Your group is ready!</h3>
              <p className="text-muted-foreground">
                Your group has been created and your first goal is set. We've sent invitations to your group members.
                Let's head to your dashboard to start tracking your progress together.
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

