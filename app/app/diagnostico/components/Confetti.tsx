"use client";

import { useEffect, useRef } from "react";

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
  /** Number of particles */
  particleCount?: number;
  /** Custom colors (defaults to brand colors) */
  colors?: string[];
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

    // Create particles based on variant
    for (let i = 0; i < particleCount; i++) {
      const particle = createParticle(
        canvas,
        variant,
        i,
        particleCount,
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
  }, [variant, duration, particleCount, colors]);

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
