"use client"

import React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import GlobalPromoDialog from "@/components/global-promo-dialog"

export default function AppClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GlobalPromoDialog />
      {children}
    </ThemeProvider>
  )
}