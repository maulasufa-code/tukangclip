import type { CleanCue, EffectDef, RawCue } from "./validator.js";
import { sanitizeCues } from "./validator.js";

export interface PlanMoment {
  start: number;
  end: number;
  hook: string;
  caption_style?: string;
  effects?: RawCue[];
}

export interface Word {
  word: string;
  start: number;
  end: number;
}

export interface ZoomKey {
  t: number;
  scale: number;
}

export interface RenderSegment {
  start: number;
  end: number;
  hook: string;
  captions: Word[];
  zooms: ZoomKey[];
  cues: CleanCue[];
}

export function buildSegments(
  moments: PlanMoment[],
  words: Word[],
  effects: EffectDef[]
): RenderSegment[] {
  return moments.map((m) => {
    const captions = words.filter((w) => w.start >= m.start && w.end <= m.end);
    const { cues } = sanitizeCues(m.effects ?? [], effects);
    const zooms: ZoomKey[] = [{ t: m.start, scale: 1 }];
    for (const c of cues) {
      if (c.kind === "zoom" || c.kind === "freeze") {
        zooms.push({ t: c.at, scale: c.scale ?? 1.12 });
        zooms.push({ t: c.at + c.dur_ms / 1000, scale: 1 });
      }
    }
    return { start: m.start, end: m.end, hook: m.hook, captions, zooms, cues };
  });
}
