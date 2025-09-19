"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  className?: string
  value?: number[]
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
  disabled?: boolean
}

function Slider({
  className,
  value,
  defaultValue = [0],
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  disabled = false,
  ...props
}: SliderProps) {
  const [internalValue, setInternalValue] = React.useState(
    value || defaultValue
  )

  const currentValue = value || internalValue
  const sliderValue = currentValue[0] || 0

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = [Number(event.target.value)]
    setInternalValue(newValue)
    onValueChange?.(newValue)
  }

  const percentage = ((sliderValue - min) / (max - min)) * 100

  return (
    <div
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      <div className="relative flex-1 h-1.5 bg-muted rounded-full">
        <div
          className="absolute h-full bg-primary rounded-full"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div
          className="absolute w-4 h-4 bg-background border-2 border-primary rounded-full shadow-sm -translate-y-1/2 top-1/2 -translate-x-1/2"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export { Slider }
