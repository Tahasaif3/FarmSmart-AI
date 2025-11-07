"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value?: string
  unit?: string
  description: string
  accentColor: string
  isChart?: boolean
  chartData?: any[]
}

export default function StatsCard({
  title,
  value,
  unit,
  description,
  accentColor,
  isChart,
  chartData,
}: StatsCardProps) {
  return (
    <Card className="relative p-6 bg-card border border-border rounded-lg flex flex-col justify-between">
      {/* Left Accent Line */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${accentColor}`}
      />

      {/* Top Section (Title + Content) */}
      <div className="pl-4 flex-1 flex flex-col items-center justify-center text-center">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          {title}
        </h3>

        {isChart && chartData ? (
          <div className="flex items-center justify-center h-40">
            <div className="relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">40%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2">
              <span className={`text-5xl font-bold ${accentColor}`}>
                {value}
              </span>
              {unit && (
                <span className="text-sm text-muted-foreground mt-2">
                  {unit}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Description at Bottom */}
      <div className="mt-auto pt-4">
        <p className="text-xs text-muted-foreground leading-relaxed text-center px-2">
          {description}
        </p>
      </div>
    </Card>
  )
}
