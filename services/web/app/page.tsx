"use client";

import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { LandingHero } from "@/components/landing/LandingHero";
import { PageBackdrop } from "@/components/landing/PageBackdrop";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { TryoutSection } from "@/components/landing/TryoutSection";
import { useCallback } from "react";

export default function HomePage() {
  const scrollToHome = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToFeatures = useCallback(() => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToTryout = useCallback(() => {
    document.getElementById("tryout")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="relative min-h-screen text-slate-100">
      <PageBackdrop />
      <SiteHeader
        onHome={scrollToHome}
        onHowItWorks={scrollToFeatures}
        onTryIt={scrollToTryout}
      />
      <main>
        <LandingHero onHowItWorks={scrollToFeatures} onTryIt={scrollToTryout} />
        <FeaturesSection />
        <TryoutSection />
      </main>
      <SiteFooter />
    </div>
  );
}
