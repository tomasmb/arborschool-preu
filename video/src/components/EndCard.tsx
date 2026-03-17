import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { colors, fonts } from "../design/tokens";

/**
 * Closing brand card. Just the Arbor logo mark + "Arbor PreU" text.
 * Clean, bold, memorable. No URL, no tagline.
 *
 * The logo draws in via clip-path, then the text springs up.
 * A subtle glow pulses behind the logo.
 */
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoReveal = interpolate(frame, [4, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const logoScale = spring({
    frame,
    fps,
    from: 0.85,
    to: 1,
    delay: 4,
    config: { damping: 12, stiffness: 80 },
  });

  const textSpring = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    delay: 18,
    config: { damping: 14, stiffness: 100 },
  });

  const glowPulse = interpolate(
    frame,
    [30, 60, 90, 120],
    [0.15, 0.35, 0.15, 0.35],
    { extrapolateRight: "extend" }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(145deg, ${colors.primary} 0%, #061f32 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      }}
    >
      {/* Glow behind logo */}
      <div
        style={{
          position: "absolute",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(217,119,6,${glowPulse}) 0%, transparent 70%)`,
          filter: "blur(40px)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
        }}
      />

      {/* Logo SVG — actual Arbor mark from logo-arbor.svg */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoReveal,
          marginBottom: 32,
        }}
      >
        <svg
          width="160"
          height="110"
          viewBox="0 0 251 173"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M240.797 150.021L240.789 150.028L251 172.841H219.937L219.791 173L219.719 172.841H85.7051L85.6328 173L85.4873 172.841H54.3682L131.867 0L131.875 0.00878906L131.877 0L173.555 0.00195312L173.557 0L240.797 150.021ZM103.661 132.776H201.762L160.206 40.0615H145.217L103.661 132.776Z"
            fill="white"
          />
          <path
            d="M108.284 0.00878906L30.9385 172.841H0L78.8428 0L108.284 0.00878906Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Brand name */}
      <div
        style={{
          fontFamily: fonts.serif,
          fontSize: 72,
          fontWeight: 900,
          color: colors.white,
          letterSpacing: -2,
          transform: `translateY(${(1 - textSpring) * 24}px)`,
          opacity: textSpring,
        }}
      >
        Arbor PreU
      </div>
    </AbsoluteFill>
  );
};
