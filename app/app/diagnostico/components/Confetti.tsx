"use client";

import { useEffect, useRef, useMemo } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
}

type ConfettiVariant = "burst" | "rain" | "mini";

interface ConfettiProps {
  /** Variant determines the animation style */
  variant?: ConfettiVariant;
  /** Duration in ms before confetti fades out */
  duration?: number;
  /** Number of particles (auto-adjusted for device performance) */
  particleCount?: number;
  /** Custom colors (defaults to brand colors) */
  colors?: string[];
}

// ============================================================================
// PERFORMANCE DETECTION
// ============================================================================

type PerformanceTier = "high" | "medium" | "low";

/** Particle count multipliers for each performance tier */
const PERFORMANCE_MULTIPLIERS: Record<PerformanceTier, number> = {
  high: 1.0,
  medium: 0.6,
  low: 0.35,
};

/** Detect device performance tier based on hardware signals */
function detectPerformanceTier(): PerformanceTier {
  if (typeof window === "undefined") return "medium";

  // Check for reduced motion preference - respect accessibility
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) return "low";

  // Check CPU cores (low-end devices typically have 2-4 cores)
  const cpuCores = navigator.hardwareConcurrency || 4;

  // Check screen size (mobile devices)
  const isMobile = window.innerWidth < 768;

  // Check device memory if available (Chrome only)
  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
  const isLowMemory = deviceMemory !== undefined && deviceMemory < 4;

  // Determine tier based on signals
  if (isLowMemory || (isMobile && cpuCores <= 4)) {
    return "low";
  }
  if (isMobile || cpuCores <= 4) {
    return "medium";
  }
  return "high";
}

// ============================================================================
// DEFAULT COLORS
// ============================================================================

const DEFAULT_COLORS = ["#d97706", "#f59e0b", "#0b3a5b", "#059669", "#10b981"];

// ============================================================================
// CONFETTI COMPONENT
// ============================================================================

export function Confetti({
  variant = "rain",
  duration = 4000,
  particleCount = 100,
  colors = DEFAULT_COLORS,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Detect performance tier once on mount (memoized to avoid recalculation)
  const performanceTier = useMemo(() => detectPerformanceTier(), []);

  // Adjust particle count based on device performance
  const adjustedParticleCount = useMemo(() => {
    const multiplier = PERFORMANCE_MULTIPLIERS[performanceTier];
    return Math.max(10, Math.round(particleCount * multiplier));
  }, [particleCount, performanceTier]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    if (variant === "mini") {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const particles: Particle[] = [];

    // Create particles based on variant (using adjusted count for performance)
    for (let i = 0; i < adjustedParticleCount; i++) {
      const particle = createParticle(
        canvas,
        variant,
        i,
        adjustedParticleCount,
        colors
      );
      particles.push(particle);
    }

    let animationFrame: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate fade out in last 20% of duration
      const fadeStart = duration * 0.8;
      const fadeOut =
        elapsed > fadeStart ? 1 - (elapsed - fadeStart) / (duration * 0.2) : 1;

      particles.forEach((p) => {
        updateParticle(p, variant);
        drawParticle(ctx, p, fadeOut);
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [variant, duration, adjustedParticleCount, colors]);

  const isFullScreen = variant !== "mini";

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${isFullScreen ? "fixed inset-0 z-50" : "absolute inset-0"}`}
      style={
        isFullScreen
          ? { width: "100vw", height: "100vh" }
          : { width: "100%", height: "100%" }
      }
    />
  );
}

// ============================================================================
// PARTICLE CREATION
// ============================================================================

function createParticle(
  canvas: HTMLCanvasElement,
  variant: ConfettiVariant,
  index: number,
  total: number,
  colors: string[]
): Particle {
  const color = colors[Math.floor(Math.random() * colors.length)];

  switch (variant) {
    case "burst": {
      // Particles burst from center in all directions
      const angle = (Math.PI * 2 * index) / total;
      const speed = 3 + Math.random() * 5;
      return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed * (0.5 + Math.random()) - 3,
        color,
        size: Math.random() * 10 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 1,
      };
    }

    case "mini": {
      // Mini burst from center of container
      const angle = (Math.PI * 2 * index) / total;
      const speed = 2 + Math.random() * 3;
      return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color,
        size: Math.random() * 6 + 3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 1,
      };
    }

    case "rain":
    default: {
      // Particles fall from top of screen
      return {
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 1,
      };
    }
  }
}

// ============================================================================
// PARTICLE UPDATE
// ============================================================================

function updateParticle(particle: Particle, variant: ConfettiVariant): void {
  particle.x += particle.vx;
  particle.y += particle.vy;
  particle.rotation += particle.rotationSpeed;

  // Gravity varies by variant
  const gravity = variant === "mini" ? 0.15 : variant === "burst" ? 0.12 : 0.1;
  particle.vy += gravity;
}

// ============================================================================
// PARTICLE DRAWING
// ============================================================================

function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  fadeOut: number
): void {
  ctx.save();
  ctx.globalAlpha = fadeOut * particle.alpha;
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.rotation);
  ctx.fillStyle = particle.color;
  ctx.fillRect(
    -particle.size / 2,
    -particle.size / 2,
    particle.size,
    particle.size / 2
  );
  ctx.restore();
}
