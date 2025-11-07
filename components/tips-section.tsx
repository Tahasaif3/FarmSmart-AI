"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TipsSection() {
  return (
    <Card className="relative p-6 bg-card border border-border rounded-lg">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 rounded-l-lg"></div>

      <h3 className="text-base font-semibold text-foreground mb-6 pl-4">Tips & Updates:</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Quick guide for new features.</p>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">Read more</Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Pro Tips for optimizing GPT tool usage.</p>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">Read more</Button>
        </div>
      </div>
    </Card>
  )
}
