"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { validateMoments, type StudioMoment, type StudioTitles } from "@/lib/studio";
import { StudioPreview } from "@/components/studio-preview";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export function StudioEditor({
  jobId,
  initialMoments,
  initialTitles,
  effectIds,
  previewUrl
}: {
  jobId: string;
  initialMoments: StudioMoment[];
  initialTitles: StudioTitles;
  effectIds: { id: string; label: string }[];
  previewUrl: string;
}) {
  const [moments, setMoments] = useState<StudioMoment[]>(initialMoments);
  const [titles, setTitles] = useState<StudioTitles>(initialTitles);
  const [active, setActive] = useState(0);
  const [fase, setFase] = useState<"idle" | "sibuk" | "ok" | "gagal">("idle");
  const [pesan, setPesan] = useState("");
  const [beatBaru, setBeatBaru] = useState("");
  const [efekBaru, setEfekBaru] = useState(effectIds[0]?.id ?? "");

  const errors = useMemo(
    () => validateMoments(moments, effectIds.map((e) => e.id)),
    [moments, effectIds]
  );
  const cur = moments[active];

  function ubahMomen(i: number, patch: Partial<StudioMoment>) {
    setMoments((ms) => ms.map((m, k) => (k === i ? { ...m, ...patch } : m)));
  }

  function hapusCue(mi: number, ci: number) {
    setMoments((ms) =>
      ms.map((m, k) =>
        k === mi ? { ...m, effects: m.effects.filter((_, j) => j !== ci) } : m
      )
    );
  }

  function geserCue(mi: number, ci: number, delta: number) {
    setMoments((ms) =>
      ms.map((m, k) =>
        k === mi
          ? {
              ...m,
              effects: m.effects.map((c, j) =>
                j === ci ? { ...c, beat: Math.round((c.beat + delta) * 100) / 100 } : c
              )
            }
          : m
      )
    );
  }

  function tambahCue() {
    const beat = Number(beatBaru);
    if (!Number.isFinite(beat)) {
      setPesan("Beat harus angka detik.");
      return;
    }
    setMoments((ms) =>
      ms.map((m, k) =>
        k === active ? { ...m, effects: [...m.effects, { effect_id: efekBaru, beat }] } : m
      )
    );
    setBeatBaru("");
  }

  async function token() {
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  }

  async function simpan() {
    if (!API) {
      setFase("gagal");
      setPesan("API backend belum dikonfigurasi.");
      return;
    }
    setFase("sibuk");
    setPesan("");
    try {
      const res = await fetch(`${API}/plans`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${await token()}`
        },
        body: JSON.stringify({ jobId, moments, titles })
      });
      if (!res.ok) throw new Error(`simpan ditolak (${res.status})`);
      const out = await res.json();
      setFase("ok");
      setPesan(`Tersimpan sebagai versi ${out.version}.`);
    } catch (e) {
      setFase("gagal");
      setPesan(e instanceof Error ? e.message : "Gagal menyimpan.");
    }
  }

  async function ekspor() {
    if (!API) {
      setFase("gagal");
      setPesan("API backend belum dikonfigurasi.");
      return;
    }
    setFase("sibuk");
    try {
      const res = await fetch(`${API}/jobs/${jobId}/rerender`, {
        method: "POST",
        headers: { authorization: `Bearer ${await token()}` }
      });
      if (!res.ok) throw new Error(`ekspor ditolak (${res.status})`);
      setFase("ok");
      setPesan("Masuk antrean render. Pantau di dasbor.");
    } catch (e) {
      setFase("gagal");
      setPesan(e instanceof Error ? e.message : "Gagal mengekspor.");
    }
  }

  if (!cur) return <p>Tidak ada momen.</p>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Momen">
          {moments.map((m, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`min-h-[44px] min-w-[44px] rounded-md border px-3 py-2 text-sm ${
                i === active ? "bg-stone-900 text-white" : "border-stone-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium" htmlFor="mulai">
          Mulai (detik)
        </label>
        <input
          id="mulai"
          type="number"
          step="0.1"
          min={0}
          value={cur.start}
          onChange={(e) => ubahMomen(active, { start: Number(e.target.value) })}
          className="mt-1 w-full min-h-[44px] rounded-md border border-stone-300 px-3"
        />
        <label className="mt-3 block text-sm font-medium" htmlFor="selesai">
          Selesai (detik)
        </label>
        <input
          id="selesai"
          type="number"
          step="0.1"
          min={0}
          value={cur.end}
          onChange={(e) => ubahMomen(active, { end: Number(e.target.value) })}
          className="mt-1 w-full min-h-[44px] rounded-md border border-stone-300 px-3"
        />
        <label className="mt-3 block text-sm font-medium" htmlFor="hook">
          Hook
        </label>
        <textarea
          id="hook"
          rows={2}
          maxLength={200}
          value={cur.hook}
          onChange={(e) => ubahMomen(active, { hook: e.target.value })}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
        />

        <h2 className="mt-5 font-semibold">Efek momen ini ({cur.effects.length})</h2>
        {cur.effects.length === 0 ? (
          <p className="mt-1 text-sm text-stone-600">Belum ada efek. Tambah di bawah.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {cur.effects.map((c, ci) => (
              <li key={ci} className="flex items-center gap-2 rounded-md border border-stone-200 p-2 text-sm">
                <span className="flex-1">
                  {c.effect_id} di {c.beat}s
                </span>
                <button onClick={() => geserCue(active, ci, -0.5)} className="min-h-[44px] min-w-[44px] rounded border px-2" aria-label={`Geser ${c.effect_id} mundur`}>
                  -0,5
                </button>
                <button onClick={() => geserCue(active, ci, 0.5)} className="min-h-[44px] min-w-[44px] rounded border px-2" aria-label={`Geser ${c.effect_id} maju`}>
                  +0,5
                </button>
                <button onClick={() => hapusCue(active, ci)} className="min-h-[44px] rounded border border-red-300 px-3 text-red-800">
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <select
            aria-label="Efek baru"
            value={efekBaru}
            onChange={(e) => setEfekBaru(e.target.value)}
            className="min-h-[44px] flex-1 rounded-md border border-stone-300 px-2"
          >
            {effectIds.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
          <input
            aria-label="Beat detik"
            placeholder="Beat"
            inputMode="decimal"
            value={beatBaru}
            onChange={(e) => setBeatBaru(e.target.value)}
            className="min-h-[44px] w-24 rounded-md border border-stone-300 px-2"
          />
          <button onClick={tambahCue} className="min-h-[44px] rounded-md bg-stone-900 px-4 text-sm text-white">
            Tambah
          </button>
        </div>

        <h2 className="mt-5 font-semibold">Judul dan hashtag</h2>
        <label className="mt-2 block text-sm" htmlFor="yt">YouTube</label>
        <input id="yt" value={titles.youtube} onChange={(e) => setTitles({ ...titles, youtube: e.target.value })} className="mt-1 w-full min-h-[44px] rounded-md border border-stone-300 px-3" />
        <label className="mt-2 block text-sm" htmlFor="tt">TikTok</label>
        <input id="tt" value={titles.tiktok} onChange={(e) => setTitles({ ...titles, tiktok: e.target.value })} className="mt-1 w-full min-h-[44px] rounded-md border border-stone-300 px-3" />
        <label className="mt-2 block text-sm" htmlFor="tag">Hashtag (koma)</label>
        <input
          id="tag"
          value={titles.hashtags.join(", ")}
          onChange={(e) => setTitles({ ...titles, hashtags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          className="mt-1 w-full min-h-[44px] rounded-md border border-stone-300 px-3"
        />

        {errors.length > 0 && (
          <ul role="alert" className="mt-4 space-y-1 text-sm text-red-800">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        {(fase === "ok" || fase === "gagal") && (
          <p role="status" className={`mt-3 text-sm ${fase === "gagal" ? "text-red-800" : ""}`}>
            {pesan}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            onClick={simpan}
            disabled={fase === "sibuk" || errors.length > 0}
            className="min-h-[44px] flex-1 rounded-md bg-stone-900 px-4 text-sm text-white disabled:opacity-50"
          >
            {fase === "sibuk" ? "Menyimpan..." : "Simpan versi baru"}
          </button>
          <button
            onClick={ekspor}
            disabled={fase === "sibuk" || errors.length > 0}
            className="min-h-[44px] flex-1 rounded-md border border-stone-900 px-4 text-sm disabled:opacity-50"
          >
            Render di server
          </button>
        </div>
      </div>
      <div>
        <StudioPreview hook={cur.hook} index={active} total={moments.length} videoUrl={previewUrl} />
        <p className="mt-2 text-sm text-stone-600">
          Pratinjau momen {active + 1}. Validator efek server tetap berlaku saat render.
        </p>
      </div>
    </div>
  );
}
