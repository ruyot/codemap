"use client"

import { useState } from "react"
import LandingPage from "@/components/landing-page"
import CyberpunkAppShell from "@/components/cyberpunk-app-shell"

export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false)

  if (isSignedIn) {
    return <CyberpunkAppShell onSignOut={() => setIsSignedIn(false)} />
  }

  return <LandingPage onSignIn={() => setIsSignedIn(true)} />
}
