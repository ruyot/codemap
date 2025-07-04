"use client"

import { Button } from "@/components/ui/button"
import MatrixRain from "@/components/matrix-rain"

interface HeroSectionProps {
  onSignIn: () => void
}

export default function HeroSection({ onSignIn }: HeroSectionProps) {
  return (
    <header className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      <MatrixRain />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6">
        <div className="text-xl font-bold text-white">Code Map</div>
        <Button
          variant="outline"
          className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          onClick={onSignIn}
        >
          Sign In
        </Button>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-6 text-6xl font-bold text-white md:text-8xl">Code Map</h1>
        <p className="mb-8 text-xl text-blue-100 md:text-2xl">The non-coder-friendly IDE</p>
        <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8 py-4">
          Get Started
        </Button>
      </div>
    </header>
  )
}
