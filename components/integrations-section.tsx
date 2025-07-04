"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Github, MessageSquare, Zap, Bot } from "lucide-react"

const integrations = [
  { name: "GitHub", icon: Github, description: "Seamless Git operations" },
  { name: "Slack", icon: MessageSquare, description: "Team notifications" },
  { name: "CI/CD", icon: Zap, description: "Automated deployments" },
  { name: "Blackbox.ai", icon: Bot, description: "AI coding assistant" },
]

export default function IntegrationsSection() {
  return (
    <section className="py-24 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">Integrations</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {integrations.map(({ name, icon: Icon, description }) => (
            <Card
              key={name}
              className="bg-gray-800/50 border-blue-500/20 backdrop-blur-sm hover:bg-gray-700/50 transition-colors cursor-pointer group"
              title={description}
            >
              <CardContent className="p-6 text-center">
                <Icon className="h-12 w-12 text-blue-400 mx-auto mb-4 group-hover:text-blue-300 transition-colors" />
                <h3 className="text-white font-semibold">{name}</h3>
                <p className="text-gray-400 text-sm mt-2">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
