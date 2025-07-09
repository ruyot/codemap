"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    features: ["5 repositories", "Basic AI reviews", "Community support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: ["Unlimited repositories", "Advanced AI agents", "Priority support", "Custom integrations"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["On-premise deployment", "Custom AI training", "24/7 support", "SLA guarantee"],
    cta: "Contact Sales",
    popular: false,
  },
]

export default function PricingSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">Pricing Plans</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative bg-gray-800/50 border-blue-500/20 backdrop-blur-sm ${
                plan.popular ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-blue-400/10 opacity-50" />
                <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-blue-400">
                  {plan.price}
                  <span className="text-lg text-gray-400">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-gray-300">
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
