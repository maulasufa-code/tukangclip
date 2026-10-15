"use client";

import { Player } from "@remotion/player";
import { AbsoluteFill } from "remotion";

function Scene({
  hook,
  label,
  videoUrl
}: {
  hook: string;
  label: string;
  videoUrl: string;
}) {
  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      {videoUrl ? (
        <video
          src={videoUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            color: "#a8a29e",
            display: "flex",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            padding: 32,
            textAlign: "center"
          }}
        >
          Pratinjau struktur. Render base di server untuk video asli.
        </div>
      )}
      <div style={{ position: "absolute", bottom: 200, width: "100%", textAlign: "center", padding: "0 32px" }}>
        <p style={{ color: "#78716c", fontSize: 24 }}>{label}</p>
        <p style={{ color: "white", fontSize: 44, fontWeight: 800, textShadow: "0 3px 12px black" }}>
          {hook}
        </p>
      </div>
    </AbsoluteFill>
  );
}

export function StudioPreview({
  hook,
  index,
  total,
  videoUrl
}: {
  hook: string;
  index: number;
  total: number;
  videoUrl: string;
}) {
  return (
    <Player
      component={Scene}
      inputProps={{ hook, label: `Momen ${index + 1} dari ${total}`, videoUrl }}
      durationInFrames={150}
      fps={30}
      compositionWidth={1080}
      compositionHeight={1920}
      style={{ width: "100%", aspectRatio: "9/16", backgroundColor: "#111" }}
      controls
    />
  );
}
