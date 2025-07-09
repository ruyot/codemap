"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import MatrixRain from "@/components/matrix-rain"
import AuthModal from "@/components/auth-modal"
import Image from "next/image"

interface HeroSectionProps {
  onSignIn: () => void
}

export default function HeroSection({ onSignIn }: HeroSectionProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <header className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      <MatrixRain />

      {/* Large Spider Logo Backdrop */}
      <div className="absolute inset-0 z-5 flex items-center justify-center">
        <div className="relative w-96 h-96 md:w-[800px] md:h-[800px] opacity-20">
          <Image
            src="/spiderlogonew.png"
            alt="Spider Logo"
            fill
            className="object-contain filter brightness-150 contrast-125"
            priority
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6">
            <Image
              src="/spiderlogonew.png"
              alt="Web Logo"
              fill
              className="object-contain filter brightness-0 invert"
              sizes="24px"
            />
          </div>
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
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-white md:text-8xl">Web</h1>
        </div>
        <p className="mb-8 text-xl text-blue-100 md:text-2xl">The IDE for everyone</p>
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
