import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export interface CaptionWord {
  word: string;
  start: number;
  end: number;
}

export interface ClipProps {
  video: string;
  captions: CaptionWord[];
  zoomAt: number;
  hook: string;
}

export function Clip({ video, captions, zoomAt, hook }: ClipProps) {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const scale = interpolate(t, [0, zoomAt, zoomAt + 0.4], [1, 1, 1.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const active = captions.findIndex((w) => t >= w.start && t < w.end);
  const shown = captions.filter((w) => w.end > t - 4 && w.start < t + 1).slice(-12);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <video
        src={video}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 220,
          width: "100%",
          textAlign: "center",
          padding: "0 40px"
        }}
      >
        <p style={{ fontSize: 64, fontWeight: 800, color: "white", textShadow: "0 4px 24px black" }}>
          {t < 3 ? hook : null}
        </p>
        <p style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.25 }}>
          {shown.map((w, i) => (
            <span
              key={`${w.start}-${i}`}
              style={{
                color: i === shown.length - 1 && active >= 0 ? "#fbbf24" : "white",
                textShadow: "0 3px 12px black"
              }}
            >
              {w.word}{" "}
            </span>
          ))}
        </p>
      </div>
    </AbsoluteFill>
  );
}
