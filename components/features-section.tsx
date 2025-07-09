"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Sparkles, PencilLine, ShieldCheck } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "Instant Feedback",
    description: "Get AI-powered code reviews and suggestions in real-time as you type.",
  },
  {
    icon: PencilLine,
    title: "Inline Suggestions",
    description: "Refactor and debug with contextual AI assistance right in your editor.",
  },
  {
    icon: ShieldCheck,
    title: "Merge Confidence",
    description: "Ship with confidence using automated testing and quality checks.",
  },
]

export default function FeaturesSection() {
  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-black to-gray-900">
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full bg-gradient-to-b from-blue-600/20 to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">Features</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="bg-gray-800/50 border-blue-500/20 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-8 w-8 text-blue-400" />
                  <CardTitle className="text-white">{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
