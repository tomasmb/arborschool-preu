import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";

interface ZoomConfig {
  scale: number;
  originX: number;
  originY: number;
  startPct: number;
}

interface ScreenClipProps {
  src: string;
  durationInFrames: number;
  zoom?: ZoomConfig | null;
}

/**
 * Plays a screen recording clip with intentional zoom and cinematic polish.
 *
 * - Smooth crossfade in/out (no hard cuts)
 * - Zoom pulls the viewer's eye toward the area of interest
 * - Subtle vignette darkens edges to focus attention on center content
 */
export const ScreenClip: React.FC<ScreenClipProps> = ({
  src,
  durationInFrames,
  zoom = null,
}) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  if (zoom) {
    const zoomStart = Math.floor(durationInFrames * zoom.startPct);
    const zoomEnd = durationInFrames - 6;

    scale = interpolate(frame, [zoomStart, zoomEnd], [1, zoom.scale], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    });

    const maxTX = (zoom.originX - 0.5) * (scale - 1) * 100;
    const maxTY = (zoom.originY - 0.5) * (scale - 1) * 100;

    translateX = interpolate(frame, [zoomStart, zoomEnd], [0, -maxTX], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    });

    translateY = interpolate(frame, [zoomStart, zoomEnd], [0, -maxTY], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    });
  }

  return (
    <AbsoluteFill style={{ background: "#000", opacity }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
          transformOrigin: "center center",
        }}
      >
        <OffthreadVideo
          src={staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Vignette overlay — darkens edges to focus attention */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 60% at 50% 45%, transparent 0%, rgba(0,0,0,0.35) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
