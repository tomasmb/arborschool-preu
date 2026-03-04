"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LoadingButton } from "@/app/components/ui";
import {
  trackLandingPageViewed,
  trackLandingCtaClicked,
} from "@/lib/analytics";
import type { LandingPrimaryAction } from "@/lib/student/journeyRouting";
import { ExampleResultsModal } from "@/app/diagnostico/components";
import {
  HeroSection,
  HowItWorksSection,
  MasterySection,
  ProgressSection,
  CtaSection,
  Footer,
} from "@/app/components/landing";

function Navigation({
  ctaLabel,
  onPrimaryAction,
  isNavigating,
}: {
  ctaLabel: string;
  onPrimaryAction: () => void;
  isNavigating: boolean;
}) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-arbor.svg"
              alt="Arbor School"
              width={36}
              height={36}
            />
            <span className="text-xl font-serif font-bold text-primary">
              Arbor PreU
            </span>
          </div>
          <div className="flex items-center gap-4">
            <LoadingButton
              onClick={onPrimaryAction}
              isLoading={isNavigating}
              className="btn-cta text-sm px-3 sm:px-4 py-2"
            >
              {ctaLabel}
            </LoadingButton>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function LandingPageClient({
  primaryAction,
}: {
  primaryAction: LandingPrimaryAction;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);

  useEffect(() => {
    trackLandingPageViewed();
  }, []);

  const goToPrimaryAction = (
    ctaLocation: "hero" | "navbar" | "bottom" | "other" = "other"
  ) => {
    trackLandingCtaClicked(ctaLocation);
    setIsNavigating(true);
    window.location.href = primaryAction.href;
  };

  const handleExampleModalStart = () => {
    setShowExampleModal(false);
    goToPrimaryAction("hero");
  };

  return (
    <main className="min-h-screen overflow-hidden">
      <Navigation
        ctaLabel={primaryAction.label}
        onPrimaryAction={() => goToPrimaryAction("navbar")}
        isNavigating={isNavigating}
      />

      <HeroSection
        onStartDiagnostic={() => goToPrimaryAction("hero")}
        onShowExample={() => setShowExampleModal(true)}
        isNavigating={isNavigating}
        ctaLabel={primaryAction.label}
        ctaSupportingText={primaryAction.supportingText}
      />

      <HowItWorksSection />
      <MasterySection />
      <ProgressSection />

      <CtaSection
        onStartDiagnostic={() => goToPrimaryAction("bottom")}
        isNavigating={isNavigating}
        ctaLabel={primaryAction.label}
        ctaSupportingText={primaryAction.supportingText}
      />

      <ExampleResultsModal
        isOpen={showExampleModal}
        onClose={() => setShowExampleModal(false)}
        onStartDiagnostic={handleExampleModalStart}
      />

      <Footer />
    </main>
  );
}
