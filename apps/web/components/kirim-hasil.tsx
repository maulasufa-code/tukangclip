"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isian, tombolPrimer, tombolSekunder } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const PLATFORM = [
  { nilai: "youtube", label: "YouTube" },
  { nilai: "tiktok", label: "TikTok" },
  { nilai: "instagram", label: "Instagram" }
];
const MAKS_TAUTAN = PLATFORM.length;

const PESAN: Record<string, string> = {
  "tautan-sudah-dipakai": "Salah satu tautan ini sudah pernah dikirim. Satu tautan hanya bisa dipakai sekali.",
  "tautan-tidak-valid": "Tautan harus diawali https://.",
  "platform-ganda": "Tiap platform hanya boleh satu tautan.",
  "lamaran-belum-diterima": "Lamaranmu belum diterima."
};

type Baris = { platform: string; url: string };

const BARIS_AWAL: Baris[] = [{ platform: "youtube", url: "" }];

export function KirimHasil({ applicationId, submissionId }: { applicationId: string; submissionId?: string }) {
  const router = useRouter();
  const [baris, setBaris] = useState<Baris[]>(BARIS_AWAL);
  const [fase, setFase] = useState<"idle" | "kerja" | "gagal" | "ok">("idle");
  const [pesan, setPesan] = useState("");

  const dipakai = (nilai: string, kecuali: number) => baris.some((b, j) => j !== kecuali && b.platform === nilai);
  const platformSisa = PLATFORM.find((p) => !baris.some((b) => b.platform === p.nilai));

  function ubah(i: number, patch: Partial<Baris>) {
    setBaris((daftar) => daftar.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  }

  function tambah() {
    if (platformSisa) setBaris((daftar) => [...daftar, { platform: platformSisa.nilai, url: "" }]);
  }

  function hapus(i: number) {
    setBaris((daftar) => daftar.filter((_, j) => j !== i));
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!API) {
      setFase("gagal");
      setPesan("API backend belum dikonfigurasi.");
      return;
    }
    setFase("kerja");
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      const res = await fetch(submissionId ? `${API}/submissions/${submissionId}/links` : `${API}/submissions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({
          applicationId,
          links: baris.map((b) => ({ platform: b.platform, url: b.url.trim() }))
        })
      });
      if (!res.ok) {
        const { detail } = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(PESAN[detail ?? ""] ?? `Gagal mengirim (${res.status}). Coba lagi.`);
      }
      setFase("ok");
      setBaris(BARIS_AWAL);
      router.refresh();
    } catch (err) {
      setFase("gagal");
      setPesan(err instanceof Error ? err.message : "Gagal mengirim.");
    }
  }

  return (
    <form onSubmit={kirim} className="mt-4 space-y-3">
      <p className="text-sm text-stone-700">
        Sudah posting klipmu? Kirim tautannya. Satu klip boleh tayang di beberapa platform dan akun, satu tautan per platform. Klip yang sama tidak boleh diunggah ulang.
      </p>
      {baris.map((b, i) => (
        <div key={i} className="flex flex-wrap gap-2">
          <select
            aria-label={`Platform tautan ${i + 1}`}
            value={b.platform}
            onChange={(e) => ubah(i, { platform: e.target.value })}
            className="min-h-[44px] rounded-[7px] border-2 border-stone-300 bg-white px-3"
          >
            {PLATFORM.map((p) => (
              <option key={p.nilai} value={p.nilai} disabled={dipakai(p.nilai, i)}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            required
            type="url"
            aria-label={`Tautan postingan ${i + 1}`}
            placeholder="https://..."
            value={b.url}
            onChange={(e) => ubah(i, { url: e.target.value })}
            className={`${isian} !mt-0 min-w-0 flex-1`}
          />
          {baris.length > 1 && (
            <button type="button" onClick={() => hapus(i)} className={tombolSekunder}>
              Hapus
            </button>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {baris.length < MAKS_TAUTAN && platformSisa && (
          <button type="button" onClick={tambah} className={tombolSekunder}>
            Tambah platform
          </button>
        )}
        <button disabled={fase === "kerja"} className={tombolPrimer}>
          {fase === "kerja" ? "Mengirim..." : "Kirim tautan"}
        </button>
      </div>
      {fase === "ok" && (
        <p role="status" className="text-sm font-medium">
          Terkirim. Kreator akan meninjau postinganmu.
        </p>
      )}
      {fase === "gagal" && (
        <p role="alert" className="text-sm text-red-900">
          {pesan}
        </p>
      )}
    </form>
  );
}
