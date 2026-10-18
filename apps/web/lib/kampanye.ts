export interface KampanyePublik {
  id: string;
  title: string;
  brief: string | null;
  budget_total: number;
  budget_remaining: number;
  rate_per_1000_views: number;
  cap_per_clip: number;
  deadline_at: string | null;
  created_at: string | null;
}

export type Urutan = "terbaru" | "budget" | "rate";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

// Daftar kampanye terbuka, tanpa login. null berarti API tidak tersambung atau gagal.
export async function ambilKampanye(urutan: Urutan = "terbaru"): Promise<KampanyePublik[] | null> {
  if (!API) return null;
  try {
    const res = await fetch(`${API}/campaigns`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const items = ((await res.json()).items ?? []) as KampanyePublik[];
    const kunci: Record<Urutan, (k: KampanyePublik) => number> = {
      terbaru: (k) => (k.created_at ? Date.parse(k.created_at) : 0),
      budget: (k) => k.budget_remaining,
      rate: (k) => k.rate_per_1000_views
    };
    return items.sort((a, b) => kunci[urutan](b) - kunci[urutan](a));
  } catch {
    return null;
  }
}
