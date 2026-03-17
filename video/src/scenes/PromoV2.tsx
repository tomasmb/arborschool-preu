import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { SCENES, VIDEO, getSceneStartFrame } from "../design/tokens";
import { TitleCard } from "../components/TitleCard";
import { ScreenClip } from "../components/ScreenClip";
import { EndCard } from "../components/EndCard";

/**
 * Main promo composition driven by the SCENES array in tokens.ts.
 */
export const PromoV2: React.FC = () => {
  const fps = VIDEO.FPS;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SCENES.map((scene, index) => {
        const from = getSceneStartFrame(index);
        const dur = Math.round(scene.duration * fps);

        if (scene.type === "card") {
          return (
            <Sequence key={scene.id} from={from} durationInFrames={dur} name={scene.id}>
              <TitleCard
                line1={scene.line1}
                line2={scene.line2}
                bg={scene.bg}
                accentWord={scene.accentWord}
                durationInFrames={dur}
              />
            </Sequence>
          );
        }

        if (scene.type === "clip") {
          return (
            <Sequence key={scene.id} from={from} durationInFrames={dur} name={scene.id}>
              <ScreenClip
                src={scene.src}
                durationInFrames={dur}
                zoom={scene.zoom}
              />
            </Sequence>
          );
        }

        if (scene.type === "end") {
          return (
            <Sequence key={scene.id} from={from} durationInFrames={dur} name={scene.id}>
              <EndCard />
            </Sequence>
          );
        }

        return null;
      })}
    </AbsoluteFill>
  );
};
