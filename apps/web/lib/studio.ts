export interface StudioCue {
  effect_id: string;
  beat: number;
  score?: number;
}

export interface StudioMoment {
  start: number;
  end: number;
  hook: string;
  caption_style?: string;
  effects: StudioCue[];
}

export interface StudioTitles {
  youtube: string;
  tiktok: string;
  hashtags: string[];
}

export function validateMoments(
  moments: StudioMoment[],
  knownIds: string[]
): string[] {
  const errors: string[] = [];
  if (moments.length < 5 || moments.length > 10)
    errors.push("Momen harus 5-10, sekarang " + moments.length + ".");
  const ordered = [...moments].sort((a, b) => a.start - b.start);
  ordered.forEach((m, i) => {
    const dur = m.end - m.start;
    if (!(dur >= 30 && dur <= 60))
      errors.push(`Momen ${i + 1} durasinya ${dur.toFixed(1)} detik, harus 30-60.`);
    if (!m.hook.trim() || m.hook.length > 200)
      errors.push(`Momen ${i + 1} butuh hook 1-200 karakter.`);
    if (i > 0 && m.start < ordered[i - 1].end)
      errors.push(`Momen ${i + 1} tumpang tindih dengan sebelumnya.`);
    for (const c of m.effects) {
      if (!knownIds.includes(c.effect_id))
        errors.push(`Momen ${i + 1} memakai efek asing: ${c.effect_id}.`);
      if (c.beat < m.start || c.beat > m.end)
        errors.push(`Beat efek ${c.effect_id} di luar momen ${i + 1}.`);
    }
  });
  return errors;
}

export function nextVersion(versions: number[]): number {
  return (versions.length ? Math.max(...versions) : 0) + 1;
}
