"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export function BeliKredit() {
  const [nominal, setNominal] = useState("50000");
  const [fase, setFase] = useState<"idle" | "sibuk" | "gagal">("idle");
  const [pesan, setPesan] = useState("");

  async function beli(e: React.FormEvent) {
    e.preventDefault();
    if (!API) {
      setFase("gagal");
      setPesan("API backend belum dikonfigurasi.");
      return;
    }
    setFase("sibuk");
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const res = await fetch(`${API}/topups`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${data.session?.access_token ?? ""}`
      },
      body: JSON.stringify({ amount: Number(nominal) })
    });
    if (!res.ok) {
      setFase("gagal");
      setPesan(`Top-up ditolak (${res.status}). Pastikan nominal minimal Rp10.000.`);
      return;
    }
    const out = await res.json();
    window.location.href = out.payUrl as string;
  }

  return (
    <form onSubmit={beli} className="mt-4 flex gap-2">
      <label htmlFor="nominal" className="sr-only">
        Nominal rupiah
      </label>
      <input
        id="nominal"
        inputMode="numeric"
        value={nominal}
        onChange={(e) => setNominal(e.target.value)}
        className="min-h-[44px] flex-1 rounded-md border border-stone-300 px-3"
      />
      <button
        type="submit"
        disabled={fase === "sibuk"}
        className="min-h-[44px] rounded-md bg-stone-900 px-5 text-sm text-white disabled:opacity-60"
      >
        {fase === "sibuk" ? "Membuat..." : "Beli kredit"}
      </button>
      {fase === "gagal" && (
        <p role="alert" className="text-sm text-red-800">
          {pesan}
        </p>
      )}
    </form>
  );
}
