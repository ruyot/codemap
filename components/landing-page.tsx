"use client"

import HeroSection from "@/components/hero-section"
import FeaturesSection from "@/components/features-section"
import AgentsSection from "@/components/agents-section"
import IntegrationsSection from "@/components/integrations-section"
import PricingSection from "@/components/pricing-section"
import SiteFooter from "@/components/site-footer"

interface LandingPageProps {
  onSignIn: () => void
}

export default function LandingPage({ onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <HeroSection onSignIn={onSignIn} />
      <main>
        <FeaturesSection />
        <AgentsSection />
        <IntegrationsSection />
        <PricingSection />
      </main>
      <SiteFooter />
    </div>
  )
}
