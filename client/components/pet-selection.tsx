"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { PetDisplay } from "@/components/pet-display"

interface PetSelectionProps {
  selectedPet: string
  onSelectPet: (pet: string) => void
}

export function PetSelection({ selectedPet, onSelectPet }: PetSelectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose a pet to grow as you complete your goals. If you fail to meet your goals, your pet's health will decline.
      </p>
      <RadioGroup value={selectedPet} onValueChange={onSelectPet} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <RadioGroupItem value="dragon" id="dragon" className="peer sr-only" />
          <Label
            htmlFor="dragon"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <PetDisplay type="dragon" stage={0} health={100} size="sm" />
            <span className="mt-2 font-medium">Dragon</span>
          </Label>
        </div>
        <div>
          <RadioGroupItem value="phoenix" id="phoenix" className="peer sr-only" />
          <Label
            htmlFor="phoenix"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <PetDisplay type="phoenix" stage={0} health={100} size="sm" />
            <span className="mt-2 font-medium">Phoenix</span>
          </Label>
        </div>
        <div>
          <RadioGroupItem value="cat" id="cat" className="peer sr-only" />
          <Label
            htmlFor="cat"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <PetDisplay type="cat" stage={0} health={100} size="sm" />
            <span className="mt-2 font-medium">Cat</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}

