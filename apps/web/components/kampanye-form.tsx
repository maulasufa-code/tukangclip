"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export function KampanyeForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    brief: "",
    sourceUrl: "",
    budgetTotal: "500000",
    ratePer1000: "5000",
    capPerClip: "50000"
  });
  const [fase, setFase] = useState<"idle" | "sibuk" | "gagal">("idle");
  const [pesan, setPesan] = useState("");

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!API) {
      setFase("gagal");
      setPesan("API backend belum dikonfigurasi.");
      return;
    }
    setFase("sibuk");
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const res = await fetch(`${API}/campaigns`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${data.session?.access_token ?? ""}`
      },
      body: JSON.stringify({
        title: form.title,
        brief: form.brief,
        sourceUrl: form.sourceUrl || null,
        budgetTotal: Number(form.budgetTotal),
        ratePer1000: Number(form.ratePer1000),
        capPerClip: Number(form.capPerClip)
      })
    });
    if (!res.ok) {
      setFase("gagal");
      setPesan(res.status === 403 ? "Hanya kreator yang bisa membuat kampanye." : `Gagal (${res.status}).`);
      return;
    }
    const out = await res.json();
    router.push(`/kampanye/${out.id}`);
  }

  const field = "mt-1 w-full min-h-[44px] rounded-md border border-stone-300 px-3";

  return (
    <form onSubmit={kirim} className="mt-6 space-y-4">
      <div>
        <label htmlFor="judul" className="block text-sm font-medium">Judul kampanye</label>
        <input id="judul" required minLength={4} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} />
      </div>
      <div>
        <label htmlFor="brief" className="block text-sm font-medium">Brief untuk editor</label>
        <textarea id="brief" rows={3} value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} className="w-full rounded-md border border-stone-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="sumber" className="block text-sm font-medium">Link video mentah (Drive atau YouTube)</label>
        <input id="sumber" type="url" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} className={field} placeholder="https://" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="budget" className="block text-sm font-medium">Budget (Rp)</label>
          <input id="budget" inputMode="numeric" required value={form.budgetTotal} onChange={(e) => setForm({ ...form, budgetTotal: e.target.value })} className={field} />
        </div>
        <div>
          <label htmlFor="rate" className="block text-sm font-medium">Rp per 1.000 views</label>
          <input id="rate" inputMode="numeric" required value={form.ratePer1000} onChange={(e) => setForm({ ...form, ratePer1000: e.target.value })} className={field} />
        </div>
        <div>
          <label htmlFor="cap" className="block text-sm font-medium">Maks per klip (Rp)</label>
          <input id="cap" inputMode="numeric" required value={form.capPerClip} onChange={(e) => setForm({ ...form, capPerClip: e.target.value })} className={field} />
        </div>
      </div>
      {fase === "gagal" && <p role="alert" className="text-sm text-red-800">{pesan}</p>}
      <button type="submit" disabled={fase === "sibuk"} className="min-h-[44px] w-full rounded-md bg-stone-900 px-4 py-3 text-sm text-white disabled:opacity-60">
        {fase === "sibuk" ? "Menyimpan..." : "Buka kampanye"}
      </button>
    </form>
  );
}
