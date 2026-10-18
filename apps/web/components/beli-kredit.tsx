"use client";

import { useState } from "react";
import { isian, label, tombolGaris, tombolPrimer } from "@/components/ui";
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
    <form onSubmit={beli} className="mt-4 flex flex-wrap gap-2">
      <label htmlFor="nominal" className="sr-only">
        Nominal rupiah
      </label>
      <input
        id="nominal"
        inputMode="numeric"
        value={nominal}
        onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
        className={`${isian} !mt-0 min-w-0 flex-1`}
      />
      <button type="submit" disabled={fase === "sibuk"} className={tombolPrimer}>
        {fase === "sibuk" ? "Membuat tagihan..." : "Beli kredit"}
      </button>
      <p className="w-full text-sm text-stone-700">Minimal Rp10.000.</p>
      {fase === "gagal" && (
        <p role="alert" className="w-full text-sm text-red-900">
          {pesan}
        </p>
      )}
    </form>
  );
}
