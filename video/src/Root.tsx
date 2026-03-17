import { Composition } from "remotion";
import { PromoVideo } from "./Video";
import { VIDEO, TOTAL_DURATION_FRAMES } from "./design/tokens";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={TOTAL_DURATION_FRAMES}
        fps={VIDEO.FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
      />
    </>
  );
};
