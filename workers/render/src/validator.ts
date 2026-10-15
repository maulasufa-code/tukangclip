export interface EffectDef {
  id: string;
  kind: "sfx" | "sticker" | "zoom" | "freeze";
  label: string;
  dur_ms: number;
  duck_db?: number;
  scale?: number;
  file_r2?: string | null;
}

export interface RawCue {
  effect_id: string;
  beat: number;
  score?: number;
}

export interface CleanCue {
  effect_id: string;
  kind: EffectDef["kind"];
  at: number;
  dur_ms: number;
  duck_db?: number;
  scale?: number;
}

export interface Drop {
  cue: RawCue;
  reason: string;
}

export const COOLDOWN_SEC = 6;
export const OFFSET_MIN = 0.1;
export const OFFSET_MAX = 0.3;
export const OFFSET_DEFAULT = 0.2;

export function sanitizeCues(
  raw: RawCue[],
  effects: EffectDef[],
  now?: { cooldown?: number; offset?: number }
): { cues: CleanCue[]; dropped: Drop[] } {
  const cooldown = now?.cooldown ?? COOLDOWN_SEC;
  const offset = Math.min(
    Math.max(now?.offset ?? OFFSET_DEFAULT, OFFSET_MIN),
    OFFSET_MAX
  );
  const byId = new Map(effects.map((e) => [e.id, e]));
  const dropped: Drop[] = [];

  const placed: CleanCue[] = [];
  const candidates = raw
    .map((cue, i) => ({ cue, i }))
    .sort((a, b) => {
      const sa = a.cue.score ?? 0;
      const sb = b.cue.score ?? 0;
      if (sb !== sa) return sb - sa;
      return a.i - b.i;
    });

  for (const { cue } of candidates) {
    const def = byId.get(cue.effect_id);
    if (!def) {
      dropped.push({ cue, reason: "id efek tidak dikenal" });
      continue;
    }
    if (!Number.isFinite(cue.beat) || cue.beat < 0) {
      dropped.push({ cue, reason: "waktu beat tidak valid" });
      continue;
    }
    const at = Math.round((cue.beat + offset) * 100) / 100;
    const end = at + def.dur_ms / 1000;
    const clash = placed.some((p) => {
      const pend = p.at + p.dur_ms / 1000;
      return Math.abs(p.at - at) < cooldown || (at < pend && p.at < end);
    });
    if (clash) {
      dropped.push({ cue, reason: "kalah cooldown atau tumpang tindih" });
      continue;
    }
    placed.push({
      effect_id: def.id,
      kind: def.kind,
      at,
      dur_ms: def.dur_ms,
      ...(def.duck_db !== undefined ? { duck_db: def.duck_db } : {}),
      ...(def.scale !== undefined ? { scale: def.scale } : {})
    });
  }

  placed.sort((a, b) => a.at - b.at);
  return { cues: placed, dropped };
}
