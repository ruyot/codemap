"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import AgentFlow from "@/components/agent-flow"

export default function AgentsSection() {
  return (
    <section className="py-24 px-4 bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">AI Agents Workflow</h2>

        <Card className="bg-gray-800/50 border-blue-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-center">Intelligent Code Management Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <AgentFlow />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
