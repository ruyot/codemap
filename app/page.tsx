"use client"

import { useState } from "react"
import LandingPage from "@/components/landing-page"
import AppShell from "@/components/app-shell"

export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false)

  if (isSignedIn) {
    return <AppShell onSignOut={() => setIsSignedIn(false)} />
  }

  return <LandingPage onSignIn={() => setIsSignedIn(true)} />
}
