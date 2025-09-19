"use client"

import * as React from "react"

import { Calendar } from "@/components/ui/calendar"

export function CalendarCard() {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date()
  )

  return (
    <Calendar
      mode="single"
      defaultMonth={date}
      numberOfMonths={2}
      selected={date}
      onSelect={setDate}
      className="rounded-lg border shadow-sm"
    />
  )
}
