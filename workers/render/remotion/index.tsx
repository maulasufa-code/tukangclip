import { Composition } from "remotion";
import { Clip } from "./Clip.js";

export function RemotionRoot() {
  return (
    <Composition
      id="Clip"
      component={Clip}
      durationInFrames={30 * 60}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ video: "", captions: [], zoomAt: 2, hook: "" }}
    />
  );
}
