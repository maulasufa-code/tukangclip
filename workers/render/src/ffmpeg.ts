import type { RenderSegment } from "./render-plan.js";

export interface ReframeOpts {
  focusX?: number;
  width?: number;
  height?: number;
}

export function reframeFilter(seg: RenderSegment, opts: ReframeOpts = {}): string {
  const focus = Math.min(Math.max(opts.focusX ?? 0.5, 0), 1);
  const w = opts.width ?? 1080;
  const h = opts.height ?? 1920;
  const t0 = seg.start.toFixed(2);
  const t1 = seg.end.toFixed(2);
  return (
    `trim=start=${t0}:end=${t1},setpts=PTS-STARTPTS,` +
    `crop=w=ih*9/16:h=ih:x=(iw-ow)*${focus}:y=0,` +
    `scale=${w}:${h}:flags=lanczos`
  );
}

export function duckVolumeExpr(windows: { at: number; dur_ms: number; duck_db: number }[]): string {
  if (windows.length === 0) return "volume=1";
  const terms = windows.map((win) => {
    const gain = Math.pow(10, win.duck_db / 20).toFixed(3);
    const a = win.at.toFixed(2);
    const b = (win.at + win.dur_ms / 1000).toFixed(2);
    return `if(between(t,${a},${b}),${gain},1)`;
  });
  return `volume='${terms.join("*")}':eval=frame`;
}

export interface RenderArgs {
  inputs: string[];
  filterComplex: string;
  output: string;
  withAudio: boolean;
}

export function buildBaseRender(
  source: string,
  segments: RenderSegment[],
  sfxFiles: Record<string, string>,
  output: string,
  opts: ReframeOpts = {}
): RenderArgs {
  const inputs = [source, ...Object.values(sfxFiles)];
  const sfxIds = Object.keys(sfxFiles);
  const parts: string[] = [];

  segments.forEach((seg, i) => {
    parts.push(`[0:v]${reframeFilter(seg, opts)}[v${i}]`);
  });

  const duckWins = segments.flatMap((seg) =>
    seg.cues
      .filter((c) => c.kind === "sfx" && c.duck_db !== undefined)
      .map((c) => ({ at: c.at - seg.start, dur_ms: c.dur_ms, duck_db: c.duck_db as number }))
  );
  parts.push(`[0:a]${duckVolumeExpr(duckWins)},aresample=48000[a0]`);

  const sfxMix: string[] = ["[a0]"];
  segments.forEach((seg) => {
    seg.cues
      .filter((c) => c.kind === "sfx")
      .forEach((c) => {
        const idx = sfxIds.indexOf(c.effect_id) + 1;
        if (idx > 0) {
          const atMs = Math.round((c.at - seg.start) * 1000);
          parts.push(`[${idx}:a]adelay=${atMs}|${atMs},aresample=48000[s${idx}_${atMs}]`);
          sfxMix.push(`[s${idx}_${atMs}]`);
        }
      });
  });

  const vConcat = segments.map((_, i) => `[v${i}]`).join("");
  parts.push(`${vConcat}concat=n=${segments.length}:v=1:a=0[vout]`);
  parts.push(`${sfxMix.join("")}amix=inputs=${sfxMix.length}:normalize=0[aout]`);

  return {
    inputs,
    filterComplex: parts.join(";"),
    output,
    withAudio: true
  };
}

export function toFfmpegArgv(args: RenderArgs): string[] {
  const argv: string[] = ["-y"];
  for (const input of args.inputs) argv.push("-i", input);
  argv.push(
    "-filter_complex",
    args.filterComplex,
    "-map",
    "[vout]",
    "-map",
    "[aout]",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    args.output
  );
  return argv;
}
