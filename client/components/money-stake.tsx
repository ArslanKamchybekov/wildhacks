"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface MoneyStakeProps {
  amount: number
  onAmountChange: (amount: number) => void
}

export function MoneyStake({ amount, onAmountChange }: MoneyStakeProps) {
  const handleSliderChange = (value: number[]) => {
    onAmountChange(value[0])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value >= 5 && value <= 100) {
      onAmountChange(value)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Set an amount of money to stake on your goal. If you fail to meet your goals, this amount will be donated to
        charity.
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="stake-amount">Stake Amount</Label>
          <div className="flex items-center">
            <span className="text-sm font-medium">$</span>
            <Input
              id="stake-amount"
              type="number"
              min={5}
              max={100}
              value={amount}
              onChange={handleInputChange}
              className="w-20 ml-1"
            />
          </div>
        </div>
        <Slider value={[amount]} min={5} max={100} step={5} onValueChange={handleSliderChange} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$5</span>
          <span>$100</span>
        </div>
      </div>
    </div>
  )
}

