"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BIAYA_PLATFORM_PERSEN, MINIMAL_TOPUP, rincianTopup, rupiah } from "@/lib/harga";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isian, tombolBahaya, tombolGaris, tombolPrimer, tombolSekunder } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

const PESAN: Record<string, string> = {
  "sudah-melamar": "Kamu sudah melamar kampanye ini.",
  "kampanye-tidak-buka": "Kampanye ini sudah tidak dibuka.",
  "batas-proyek-aktif": "Kamu sudah punya 3 proyek aktif. Selesaikan salah satunya dulu.",
  "bukan-kampanyemu": "Ini bukan kampanyemu.",
  "bukan-pihakmu": "Kamu bukan pihak di klip ini.",
  "bukan-status-submitted": "Klip ini sudah pernah diputuskan.",
  "belum-disetujui": "Klip harus disetujui kreator dulu.",
  "lamaran-belum-diterima": "Lamaranmu belum diterima.",
  "belum-tayang": "Klip belum tayang.",
  "tersangkut-sengketa": "Klip masih tersangkut sengketa.",
  "tidak-ditemukan": "Data tidak ditemukan."
};

/** Panggil API backend dengan token sesi. Galat dijadikan kalimat yang bisa dibaca orang. */
async function call(path: string, method: string, body?: unknown) {
  if (!API) throw new Error("API backend belum dikonfigurasi.");
  const { data } = await supabaseBrowser().auth.getSession();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${data.session?.access_token ?? ""}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const { detail } = (await res.json().catch(() => ({}))) as { detail?: string };
    const dasar = typeof detail === "string" ? detail : "";
    throw new Error(
      PESAN[dasar] ??
        (dasar.startsWith("minimal-topup")
          ? `Budget minimal ${rupiah(MINIMAL_TOPUP)}.`
          : res.status === 403
            ? "Peran akunmu tidak boleh melakukan ini."
            : `Gagal (${res.status}). Coba lagi.`)
    );
  }
  return res.json();
}

/** Bungkus satu aksi: status sibuk, pesan galat, dan segarkan halaman kalau berhasil. */
function useAksi() {
  const router = useRouter();
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState("");
  async function jalan(fn: () => Promise<unknown>, sesudah?: () => void) {
    setSibuk(true);
    setPesan("");
    try {
      await fn();
      sesudah?.();
      router.refresh();
    } catch (e) {
      setPesan(e instanceof Error && e.message ? e.message : "Aksi gagal. Coba lagi.");
    } finally {
      setSibuk(false);
    }
  }
  return { sibuk, pesan, jalan };
}

function Galat({ pesan }: { pesan: string }) {
  return pesan ? (
    <p role="alert" className="mt-2 text-sm text-red-900">
      {pesan}
    </p>
  ) : null;
}

export function LamarButton({ campaignId, mine, sudah }: { campaignId: string; mine: boolean; sudah?: boolean }) {
  const { sibuk, pesan, jalan } = useAksi();
  if (mine) return null;
  if (sudah) {
    return <p className="text-sm font-medium">Kamu sudah melamar kampanye ini.</p>;
  }
  return (
    <div>
      <button
        disabled={sibuk}
        onClick={() => jalan(() => call(`/campaigns/${campaignId}/apply`, "POST"))}
        className={tombolPrimer}
      >
        {sibuk ? "Melamar..." : "Lamar proyek ini"}
      </button>
      <Galat pesan={pesan} />
    </div>
  );
}

export function PutusanButtons({ appId }: { appId: string }) {
  const { sibuk, pesan, jalan } = useAksi();
  const putus = (accept: boolean) =>
    jalan(() => call(`/applications/${appId}/decision`, "POST", { accept }));
  return (
    <div>
      <div className="flex gap-2">
        <button disabled={sibuk} onClick={() => putus(true)} className={tombolPrimer}>
          Terima
        </button>
        <button disabled={sibuk} onClick={() => putus(false)} className={tombolGaris}>
          Tolak
        </button>
      </div>
      <Galat pesan={pesan} />
    </div>
  );
}

export function ReviewButtons({ subId }: { subId: string }) {
  const { sibuk, pesan, jalan } = useAksi();
  const nilai = (approve: boolean) =>
    jalan(() => call(`/submissions/${subId}/review`, "POST", { approve }));
  return (
    <div>
      <div className="flex gap-2">
        <button disabled={sibuk} onClick={() => nilai(true)} className={tombolPrimer}>
          Setujui
        </button>
        <button disabled={sibuk} onClick={() => nilai(false)} className={tombolBahaya}>
          Tolak
        </button>
      </div>
      <Galat pesan={pesan} />
    </div>
  );
}

export function TandaiPosted({ subId }: { subId: string }) {
  const { sibuk, pesan, jalan } = useAksi();
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("youtube");
  return (
    <form
      className="mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        void jalan(() => call(`/submissions/${subId}/posted`, "POST", { url, platform }));
      }}
    >
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Platform tempat klip tayang"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="min-h-[44px] rounded-[7px] border-2 border-stone-300 bg-white px-3"
        >
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
        </select>
        <input
          required
          type="url"
          aria-label="URL klip tayang"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="min-h-[44px] min-w-0 flex-1 rounded-[7px] border-2 border-stone-300 bg-white px-3"
        />
        <button disabled={sibuk} className={tombolSekunder}>
          Tandai tayang
        </button>
      </div>
      <Galat pesan={pesan} />
    </form>
  );
}

export function DanaiButton({ campaignId }: { campaignId: string }) {
  const [nominal, setNominal] = useState("");
  const { sibuk, pesan, jalan } = useAksi();
  const [lokal, setLokal] = useState("");
  const angka = Number(nominal.replace(/\D/g, "")) || 0;
  const r = rincianTopup(angka);
  return (
    <>
      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (r.budget < MINIMAL_TOPUP) {
            setLokal(`Budget minimal ${rupiah(MINIMAL_TOPUP)}.`);
            return;
          }
          setLokal("");
          void jalan(async () => {
            const o = await call(`/campaigns/${campaignId}/fund`, "POST", { amount: r.budget });
            window.location.href = o.payUrl as string;
          });
        }}
      >
        <input
          aria-label="Tambah budget untuk clipper, dalam rupiah"
          placeholder={`Tambah budget, minimal ${rupiah(MINIMAL_TOPUP)}`}
          inputMode="numeric"
          value={nominal}
          onChange={(e) => setNominal(e.target.value)}
          className={`${isian} !mt-0 min-w-0 flex-1`}
        />
        <button disabled={sibuk} className={tombolPrimer}>
          {sibuk ? "Membuat tagihan..." : "Danai via Xendit"}
        </button>
      </form>
      <Galat pesan={lokal || pesan} />
      {r.budget > 0 && (
        <p className="mt-2 text-sm text-stone-700">
          Budget {rupiah(r.budget)} masuk utuh ke escrow untuk clipper. Biaya platform {BIAYA_PLATFORM_PERSEN}%{" "}
          {rupiah(r.biaya)}. Total dibayar {rupiah(r.total)}.
        </p>
      )}
    </>
  );
}

export function SengketaBox({ subId, flagged, mine }: { subId: string; flagged: boolean; mine: boolean }) {
  const { sibuk, pesan, jalan } = useAksi();
  const [catatan, setCatatan] = useState("");
  const [terbuka, setTerbuka] = useState(false);
  return (
    <div className="mt-3 text-sm">
      {flagged && (
        <p role="alert" className="font-medium text-red-900">
          Ditandai: perlu pemeriksaan views.
        </p>
      )}
      {!terbuka ? (
        <div className="mt-1 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTerbuka(true)}
            className="inline-flex min-h-[44px] items-center text-stone-700 underline underline-offset-4"
          >
            Ajukan sengketa
          </button>
          {mine && flagged && (
            <button
              type="button"
              disabled={sibuk}
              onClick={() => jalan(() => call(`/submissions/${subId}/dispute/resolve`, "POST", { clear: true }))}
              className={tombolSekunder}
            >
              Pulihkan
            </button>
          )}
        </div>
      ) : (
        <form
          className="mt-1 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void jalan(
              () => call(`/submissions/${subId}/dispute`, "POST", { note: catatan }),
              () => setTerbuka(false)
            );
          }}
        >
          <input
            required
            aria-label="Catatan sengketa"
            placeholder="Alasan sengketa"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="min-h-[44px] min-w-0 flex-1 rounded-[7px] border-2 border-stone-300 bg-white px-3"
          />
          <button disabled={sibuk} className={tombolBahaya}>
            Kirim sengketa
          </button>
          <button type="button" onClick={() => setTerbuka(false)} className={tombolSekunder}>
            Batal
          </button>
        </form>
      )}
      <Galat pesan={pesan} />
    </div>
  );
}

export function TerbitButton({ subId }: { subId: string }) {
  const { sibuk, pesan, jalan } = useAksi();
  return (
    <div className="mt-3">
      <button
        disabled={sibuk}
        onClick={() => jalan(() => call(`/submissions/${subId}/publish`, "POST", { platform: "youtube" }))}
        className={tombolPrimer}
      >
        {sibuk ? "Menerbitkan..." : "Terbitkan ke YouTube"}
      </button>
      <Galat pesan={pesan} />
    </div>
  );
}

/** Putar klip yang dikirim clipper lewat tautan sementara dari backend. */
export function LihatKlip({ subId }: { subId: string }) {
  const [url, setUrl] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState("");
  if (url) {
    return <video src={url} controls className="mt-3 max-h-[420px] w-full rounded-[7px] bg-black" />;
  }
  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={sibuk}
        onClick={async () => {
          setSibuk(true);
          setPesan("");
          try {
            setUrl(((await call(`/submissions/${subId}/file`, "GET")) as { url: string }).url);
          } catch (e) {
            setPesan(e instanceof Error ? e.message : "Klip belum bisa dibuka.");
          } finally {
            setSibuk(false);
          }
        }}
        className={tombolSekunder}
      >
        {sibuk ? "Membuka..." : "Putar klip"}
      </button>
      <Galat pesan={pesan} />
    </div>
  );
}
