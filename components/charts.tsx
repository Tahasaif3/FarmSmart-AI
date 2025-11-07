"use client"

import type React from "react"
import { Card } from "@/components/ui/card"

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
}

export default function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <Card className="p-6 bg-card border border-border rounded-lg">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="w-full">{children}</div>
    </Card>
  )
}
