import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors, fonts, VIDEO } from "../design/tokens";

interface TitleCardProps {
  line1: string;
  line2: string;
  /** Background style: cream with dark text or navy with white text. */
  bg: "cream" | "navy";
  /** If set, this substring in line1 renders in accent color. */
  accentWord?: string | null;
  durationInFrames: number;
}

/**
 * Typewriter title card matching the reference style.
 *
 * - Line 1 types first at ~1 character per frame
 * - Line 2 starts after line 1 finishes + a short pause
 * - Both lines hold until the card ends
 * - Subtle fade-out in the last few frames
 */
export const TitleCard: React.FC<TitleCardProps> = ({
  line1,
  line2,
  bg,
  accentWord,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const isDark = bg === "navy";
  const background = isDark
    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
    : colors.cream;
  const textColor = isDark ? colors.white : colors.charcoal;

  // Typing speed: ~1 char per frame with a short initial delay
  const INITIAL_DELAY = 8;
  const CHARS_PER_FRAME = 1;
  const LINE_GAP = 6; // pause frames between line1 and line2

  const line1End = INITIAL_DELAY + Math.ceil(line1.length / CHARS_PER_FRAME);
  const line2Start = line1End + LINE_GAP;
  const line2End =
    line2Start + Math.ceil(line2.length / CHARS_PER_FRAME);

  // How many chars to show for each line
  const line1Chars = Math.min(
    line1.length,
    Math.max(0, Math.floor((frame - INITIAL_DELAY) * CHARS_PER_FRAME))
  );
  const line2Chars = Math.min(
    line2.length,
    Math.max(0, Math.floor((frame - line2Start) * CHARS_PER_FRAME))
  );

  // Blinking cursor appears at the end of the currently typing line
  const cursorVisible = frame % 16 < 10;
  const isTypingLine1 = frame >= INITIAL_DELAY && line1Chars < line1.length;
  const isTypingLine2 = frame >= line2Start && line2Chars < line2.length;
  const showCursor = isTypingLine1 || isTypingLine2;

  // Fade out in the last 6 frames
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 6, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Render line1 with optional accent coloring
  const renderLine1 = () => {
    const visible = line1.slice(0, line1Chars);
    if (!accentWord || !visible.includes(accentWord.slice(0, line1Chars))) {
      // Check if accent word is fully visible
      if (accentWord && visible.includes(accentWord)) {
        const idx = visible.indexOf(accentWord);
        return (
          <>
            {visible.slice(0, idx)}
            <span style={{ color: colors.accent }}>{accentWord}</span>
            {visible.slice(idx + accentWord.length)}
          </>
        );
      }
      return <>{visible}</>;
    }
    return <>{visible}</>;
  };

  return (
    <AbsoluteFill
      style={{
        background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 140px",
        opacity: fadeOut,
      }}
    >
      {/* Decorative accent bar */}
      <div
        style={{
          width: 48,
          height: 4,
          borderRadius: 2,
          background: isDark ? colors.accentLight : colors.accent,
          marginBottom: 36,
          opacity: interpolate(frame, [0, INITIAL_DELAY], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      {/* Line 1 */}
      <div
        style={{
          fontFamily: fonts.serif,
          fontSize: 64,
          fontWeight: 700,
          color: textColor,
          lineHeight: 1.2,
          letterSpacing: -1.5,
          textAlign: "center",
          minHeight: 80,
        }}
      >
        {renderLine1()}
        {isTypingLine1 && cursorVisible && (
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: 60,
              background: colors.accent,
              marginLeft: 2,
              verticalAlign: "middle",
            }}
          />
        )}
      </div>

      {/* Line 2 */}
      <div
        style={{
          fontFamily: fonts.serif,
          fontSize: 64,
          fontWeight: 700,
          color: textColor,
          lineHeight: 1.2,
          letterSpacing: -1.5,
          textAlign: "center",
          marginTop: 8,
          minHeight: 80,
        }}
      >
        {line2.slice(0, line2Chars)}
        {isTypingLine2 && cursorVisible && (
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: 60,
              background: colors.accent,
              marginLeft: 2,
              verticalAlign: "middle",
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
