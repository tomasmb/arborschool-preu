"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { trackLandingPageViewed } from "@/lib/analytics";
import {
  HeroSection,
  ProblemSection,
  HowItWorksSection,
  StakeholderTabs,
  CtaSection,
  Footer,
} from "@/app/components/landing";

const MasterySection = dynamic(
  () =>
    import("@/app/components/landing").then((mod) => mod.MasterySection),
  { ssr: false }
);
const ProgressSection = dynamic(
  () =>
    import("@/app/components/landing").then((mod) => mod.ProgressSection),
  { ssr: false }
);

function smoothScrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function Navigation({
  onRequestDemo,
}: {
  onRequestDemo: () => void;
}) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50
        bg-white/80 backdrop-blur-lg border-b border-gray-100"
    >
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
          <div className="flex items-center gap-3">
            <a
              href="/estudiantes"
              className="inline-flex text-sm text-cool-gray
                hover:text-charcoal transition-colors"
            >
              Para estudiantes
            </a>
            <button
              onClick={onRequestDemo}
              className="btn-cta text-sm px-3 sm:px-4 py-2"
            >
              Solicitar demo
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function LandingPageClient() {
  useEffect(() => {
    trackLandingPageViewed();
  }, []);

  const scrollToDemo = useCallback(
    () => smoothScrollTo("demo"),
    []
  );
  const scrollToPlatform = useCallback(
    () => smoothScrollTo("plataforma"),
    []
  );

  return (
    <main className="min-h-screen overflow-hidden">
      <Navigation onRequestDemo={scrollToDemo} />
      <HeroSection
        onRequestDemo={scrollToDemo}
        onViewPlatform={scrollToPlatform}
      />
      <ProblemSection />
      <HowItWorksSection />
      <MasterySection />
      <ProgressSection />
      <StakeholderTabs />
      <CtaSection />
      <Footer />
    </main>
  );
}
