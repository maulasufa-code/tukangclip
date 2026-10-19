"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isian, tombolPrimer } from "@/components/ui";
import { bayarLewatSnap } from "@/lib/snap";
import { supabaseBrowser } from "@/lib/supabase/client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

const PESAN_HASIL: Record<string, string> = {
  sukses: "Pembayaran diterima. Saldo bertambah setelah Midtrans mengonfirmasi, biasanya dalam beberapa detik.",
  menunggu: "Pembayaran menunggu konfirmasi. Saldo bertambah setelah pembayaranmu lunas."
};

export function BeliKredit() {
  const router = useRouter();
  const [nominal, setNominal] = useState("50000");
  const [fase, setFase] = useState<"idle" | "sibuk" | "gagal" | "selesai">("idle");
  const [pesan, setPesan] = useState("");

  async function beli(e: React.FormEvent) {
    e.preventDefault();
    if (!API) {
      setFase("gagal");
      setPesan("API backend belum dikonfigurasi.");
      return;
    }
    setFase("sibuk");
    setPesan("");
    try {
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
      const hasil = await bayarLewatSnap(out.snapToken as string);
      if (hasil === "gagal") {
        setFase("gagal");
        setPesan("Pembayaran gagal dibuka. Coba lagi.");
        return;
      }
      if (hasil === "batal") {
        setFase("idle");
        return;
      }
      setFase("selesai");
      setPesan(PESAN_HASIL[hasil]);
      router.refresh();
    } catch (err) {
      setFase("gagal");
      setPesan(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    }
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
        {fase === "sibuk" ? "Membuka pembayaran..." : "Beli kredit"}
      </button>
      <p className="w-full text-sm text-stone-700">Minimal Rp10.000. Pembayaran lewat Midtrans.</p>
      {fase === "gagal" && (
        <p role="alert" className="w-full text-sm text-red-900">
          {pesan}
        </p>
      )}
      {fase === "selesai" && (
        <p role="status" className="w-full text-sm text-stone-800">
          {pesan}
        </p>
      )}
    </form>
  );
}
