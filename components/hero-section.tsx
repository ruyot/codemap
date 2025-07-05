"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import MatrixRain from "@/components/matrix-rain"
import AuthModal from "@/components/auth-modal"

interface HeroSectionProps {
  onSignIn: () => void
}

export default function HeroSection({ onSignIn }: HeroSectionProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <header className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      <MatrixRain />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            {/* Black Widow Spider */}
            <ellipse cx="12" cy="12" rx="4" ry="6" fill="currentColor"/>
            <circle cx="12" cy="10" r="2.5" fill="currentColor"/>
            <circle cx="10.5" cy="9" r="0.5" fill="white"/>
            <circle cx="13.5" cy="9" r="0.5" fill="white"/>
            {/* Legs */}
            <path d="M8 8 L4 4 M8 10 L3 10 M8 12 L4 16 M8 14 L5 18" stroke="currentColor" strokeWidth="1" fill="none"/>
            <path d="M16 8 L20 4 M16 10 L21 10 M16 12 L20 16 M16 14 L19 18" stroke="currentColor" strokeWidth="1" fill="none"/>
            {/* Red hourglass marking */}
            <path d="M10 14 L12 16 L14 14 L12 12 Z" fill="#dc2626"/>
          </svg>
          <div className="text-xl font-bold text-white">Web</div>
        </div>
        <Button
          variant="outline"
          className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          onClick={() => setShowAuthModal(true)}
        >
          Sign In
        </Button>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <div className="flex items-center gap-4 mb-6">
          <svg className="w-16 h-16 md:w-24 md:h-24 text-white" viewBox="0 0 24 24" fill="currentColor">
            {/* Black Widow Spider */}
            <ellipse cx="12" cy="12" rx="4" ry="6" fill="currentColor"/>
            <circle cx="12" cy="10" r="2.5" fill="currentColor"/>
            <circle cx="10.5" cy="9" r="0.5" fill="white"/>
            <circle cx="13.5" cy="9" r="0.5" fill="white"/>
            {/* Legs */}
            <path d="M8 8 L4 4 M8 10 L3 10 M8 12 L4 16 M8 14 L5 18" stroke="currentColor" strokeWidth="1" fill="none"/>
            <path d="M16 8 L20 4 M16 10 L21 10 M16 12 L20 16 M16 14 L19 18" stroke="currentColor" strokeWidth="1" fill="none"/>
            {/* Red hourglass marking */}
            <path d="M10 14 L12 16 L14 14 L12 12 Z" fill="#dc2626"/>
          </svg>
          <h1 className="text-6xl font-bold text-white md:text-8xl">Web</h1>
        </div>
        <p className="mb-8 text-xl text-blue-100 md:text-2xl">The non-coder-friendly IDE</p>
        <Button 
          size="lg" 
          className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8 py-4"
          onClick={() => setShowAuthModal(true)}
        >
          Get Started
        </Button>
      </div>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={onSignIn}
      />
    </header>
  )
}
