"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { LoadingButton } from "@/app/components/ui";
import {
  trackLandingPageViewed,
  trackLandingCtaClicked,
} from "@/lib/analytics";
import { ExampleResultsModal } from "@/app/diagnostico/components";
import {
  HeroSection,
  HowItWorksSection,
  MasterySection,
  DailyPlanSection,
  ProgressSection,
  CtaSection,
  Footer,
} from "@/app/components/landing";

// ============================================================================
// NAVIGATION COMPONENT
// ============================================================================

function Navigation({
  onStartDiagnostic,
  isNavigating,
}: {
  onStartDiagnostic: () => void;
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
            <span className="hidden sm:inline-flex text-sm font-medium text-success bg-success/10 px-3 py-1.5 rounded-full">
              ¡Disponible!
            </span>
            <LoadingButton
              onClick={onStartDiagnostic}
              isLoading={isNavigating}
              className="btn-cta text-sm px-4 py-2"
            >
              Hacer Diagnóstico
            </LoadingButton>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function Home() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);

  // Track landing page view on mount
  useEffect(() => {
    trackLandingPageViewed();
  }, []);

  const goToDiagnostic = (
    ctaLocation: "hero" | "navbar" | "bottom" | "other" = "other"
  ) => {
    trackLandingCtaClicked(ctaLocation);
    setIsNavigating(true);
    window.location.href = "/diagnostico";
  };

  const handleExampleModalStart = () => {
    setShowExampleModal(false);
    goToDiagnostic("hero"); // Modal is triggered from hero section
  };

  return (
    <main className="min-h-screen overflow-hidden">
      <Navigation
        onStartDiagnostic={() => goToDiagnostic("navbar")}
        isNavigating={isNavigating}
      />

      <HeroSection
        onStartDiagnostic={() => goToDiagnostic("hero")}
        onShowExample={() => setShowExampleModal(true)}
        isNavigating={isNavigating}
      />

      <HowItWorksSection />
      <MasterySection />
      <DailyPlanSection />
      <ProgressSection />

      <CtaSection
        onStartDiagnostic={() => goToDiagnostic("bottom")}
        isNavigating={isNavigating}
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
