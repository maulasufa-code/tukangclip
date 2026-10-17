"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/* ---------- Peta momen (ilustrasi) ---------- */

const JUMLAH_BAR = 46;
const BAR_KUAT = [17, 18, 19, 20, 21, 31, 32, 33];

// Tinggi bar dihitung tetap, supaya server dan klien menghasilkan markup yang sama.
const tinggiBar = Array.from({ length: JUMLAH_BAR }, (_, i) =>
  BAR_KUAT.includes(i) ? 72 + (i % 3) * 9 : 22 + Math.abs(Math.sin(i * 1.37) * Math.cos(i * 0.41)) * 62
);

export function HighlightMap() {
  const [terpilih, setTerpilih] = useState<number | null>(null);

  return (
    <div className="flex w-[86%] flex-col gap-3.5">
      {/* Bar ini hiasan ilustrasi. Keterangannya ada di teks aria-live di bawah. */}
      <div className="flex h-[130px] items-end gap-[3px]" aria-hidden="true">
        {tinggiBar.map((h, i) => (
          <span
            key={i}
            onMouseEnter={() => setTerpilih(i)}
            style={{ height: `${h}%` }}
            className={`flex-1 origin-bottom rounded-t-[2px] transition-[background,transform] duration-300 hover:scale-y-[1.06] ${
              BAR_KUAT.includes(i) ? "bg-[#f9a3c4] hover:bg-cl-accent" : "bg-[#c5cde0] hover:bg-cl-accent"
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {["Hook", "Momen", "Judul"].map((c) => (
          <span
            key={c}
            className="rounded border border-[#d6deea] bg-white px-2 py-1 font-mono text-[10.5px] uppercase text-cl-ink"
          >
            {c}
          </span>
        ))}
      </div>
      <p className="min-h-[2.6em] text-[13px] text-[#3b4a86]" aria-live="polite">
        {terpilih === null
          ? "Arahkan kursor ke bar untuk melihat momennya."
          : `Ilustrasi · ${menit(terpilih)}${BAR_KUAT.includes(terpilih) ? " · kandidat hook" : " · bukan kandidat"}`}
      </p>
    </div>
  );
}

function menit(i: number) {
  const m = Math.round(i * 1.4);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/* ---------- Log job ---------- */

const baris = [
  { ok: true, teks: "Unggah diterima, berkas masuk penyimpanan" },
  { ok: true, teks: "Job masuk antrean di dasbor" },
  { ok: true, teks: "Versi Studio tersimpan" },
  { ok: false, teks: "Analisis otomatis: masih dalam pengerjaan" },
  { ok: false, teks: "Render otomatis: masih dalam pengerjaan" }
];

export function LogJob() {
  const wadah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wadah.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pengamat = new IntersectionObserver(
      (masuk) => {
        if (!masuk[0]?.isIntersecting) return;
        pengamat.disconnect();
        gsap.fromTo(
          el.querySelectorAll(".log-baris"),
          { opacity: 0, y: 4 },
          { opacity: 1, y: 0, duration: 0.3, stagger: 0.42, ease: "power2.out" }
        );
      },
      { threshold: 0.5 }
    );
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);

  return (
    <div ref={wadah} className="w-[80%] min-h-[150px] rounded-md bg-[#e9edf2] p-4 font-mono text-[10.5px] leading-[1.6] text-cl-ink max-[560px]:w-[92%]">
      {baris.map((b) => (
        <div key={b.teks} className="log-baris">
          <span className={b.ok ? "text-cl-accent" : "text-cl-ink-soft"}>{b.ok ? "✓" : "○"}</span> {b.teks}
        </div>
      ))}
    </div>
  );
}

/* ---------- Grafik contoh ---------- */

const DATA = [
  [24, 31, 28, 42, 38, 55, 49, 72],
  [30, 34, 41, 38, 52, 58, 61, 66],
  [18, 20, 26, 22, 30, 41, 36, 52]
];
const METRIK = ["Views", "Watch time", "Shares"];

export function ViewsChart() {
  const [k, setK] = useState(0);
  const d = DATA[k];
  const titik = d.map((v, i) => [30 + i * (360 / 7), 180 - (v - 20) * 2.5] as const);
  const garis = "M" + titik.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");
  const puncak = d.indexOf(Math.max(...d));

  return (
    <figure className="flex w-[88%] flex-col items-center gap-3 max-[560px]:w-[92%]">
      <div role="group" aria-label="Contoh metrik" className="inline-flex gap-0.5 rounded-md bg-white p-[3px] shadow-[0_2px_10px_rgba(23,43,118,0.08)]">
        {METRIK.map((m, i) => (
          <button
            key={m}
            type="button"
            aria-pressed={i === k}
            onClick={() => setK(i)}
            className={`min-h-[44px] rounded px-3 text-xs transition-colors duration-200 ${
              i === k ? "bg-cl-seg text-white" : "text-cl-ink"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 400 210" role="img" aria-label="Contoh grafik performa klip" className="block h-auto w-full">
        <g stroke="#d5dce8" strokeDasharray="3 4">
          <line x1="30" x2="390" y1="30" y2="30" />
          <line x1="30" x2="390" y1="80" y2="80" />
          <line x1="30" x2="390" y1="130" y2="130" />
        </g>
        <path d={`${garis} L390 180 L30 180 Z`} fill="rgba(255,72,139,0.12)" />
        <path d={garis} fill="none" stroke="#ff488b" strokeWidth={2} strokeLinejoin="round" />
        {titik.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={i === puncak ? 5 : 2.5}
            fill={i === puncak ? "#ff488b" : "#fff"}
            stroke="#ff488b"
            strokeWidth={1.5}
          />
        ))}
        <text x="30" y="202" className="font-mono text-[9px]" fill="#6d79a8">POST 1</text>
        <text x="340" y="202" className="font-mono text-[9px]" fill="#6d79a8">POST 8</text>
      </svg>
      <figcaption className="text-center text-[11.5px] text-[#6d79a8]">Contoh tampilan grafik, bukan data nyata.</figcaption>
    </figure>
  );
}

/* ---------- Kartu peran ---------- */

type Kartu = { ikon: string; judul: string; isi: string; meta: string };

const PERAN: { label: string; kartu: Kartu[] }[] = [
  {
    label: "Kreator",
    kartu: [
      { ikon: "play", judul: "Unggah langsung", isi: "Berkas MP4 sampai 2 GB dikirim ke penyimpanan tanpa mampir ke server web.", meta: "Jalur instan" },
      { ikon: "bolt", judul: "Antrean analisis", isi: "Job bisa kamu pantau di dasbor sejak masuk antrean.", meta: "Dasbor" },
      { ikon: "scissor", judul: "Pilih jalur", isi: "Jalur instan memakai kredit, jalur organic memakai kampanye dan editor.", meta: "1 kredit per video" },
      { ikon: "chat", judul: "Tayang dari akunmu", isi: "Klip organic tayang dari akun yang kamu sambungkan.", meta: "Akun sosial" }
    ]
  },
  {
    label: "Editor",
    kartu: [
      { ikon: "mic", judul: "Cari proyek", isi: "Buka pasar dan kirim lamaran ke kampanye yang cocok.", meta: "Pasar proyek" },
      { ikon: "scissor", judul: "Kerjakan potongannya", isi: "Potong, beri efek, dan rapikan judul di Studio.", meta: "Studio" },
      { ikon: "slides", judul: "Kirim sebelum tenggat", isi: "Hasil dikirim sebelum tenggat 72 jam sejak lamaran diterima.", meta: "72 jam" },
      { ikon: "bolt", judul: "Dibayar per views", isi: "Bayaran dihitung per 1.000 views, dengan batas per klip.", meta: "Per 1.000 views" }
    ]
  },
  {
    label: "Studio",
    kartu: [
      { ikon: "scissor", judul: "Geser titik potong", isi: "Titik mulai dan akhir tiap momen bisa kamu geser sendiri.", meta: "Studio" },
      { ikon: "chat", judul: "Tempel efek per beat", isi: "Efek ditempel di beat tertentu, lalu tersimpan di versi itu.", meta: "Efek" },
      { ikon: "slides", judul: "Simpan versi", isi: "Tiap penyimpanan membuat versi baru yang bisa dibuka lagi.", meta: "Versi" },
      { ikon: "mic", judul: "Rapikan judul", isi: "Judul versi YouTube dan TikTok, plus hashtag.", meta: "Judul" }
    ]
  }
];

const IKON: Record<string, string> = {
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v4",
  chat: "M4 5h16v11H9l-5 4z",
  scissor: "M6 7.5a2.5 2.5 0 1 0 0 .01M6 16.5a2.5 2.5 0 1 0 0 .01M8 8.5L20 18M8 15.5L20 6",
  slides: "M3 4h18v12H3zM8 20h8M12 16v4",
  bolt: "M13 3L5 14h6l-1 7 8-11h-6z",
  play: "M3 5h18v14H3zM10 9l5 3-5 3z"
};

export function RoleCards() {
  const [t, setT] = useState(0);
  const wadah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wadah.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      wadah.current.querySelectorAll(".kartu"),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power3.out", clearProps: "transform" }
    );
  }, [t]);

  return (
    <>
      <div role="group" aria-label="Peran" className="inline-flex gap-0.5 rounded-md bg-white/95 p-[3px] shadow-[0_2px_10px_rgba(23,43,118,0.08)]">
        {PERAN.map((p, i) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={i === t}
            onClick={() => setT(i)}
            className={`min-h-[44px] rounded px-3 text-xs transition-colors duration-200 ${
              i === t ? "bg-cl-seg text-white" : "text-cl-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div ref={wadah} className="mt-7 grid w-full max-w-[860px] grid-cols-1 gap-3 text-left sm:grid-cols-2">
        {PERAN[t].kartu.map((k) => (
          <a
            key={k.judul}
            href="/unggah"
            className="kartu grid grid-cols-[76px_1fr] gap-3.5 rounded-md bg-white/95 p-3 text-cl-ink transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.4)]"
          >
            <span className="grid h-[76px] place-items-center rounded bg-[#d9dcec]">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#172b76" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={IKON[k.ikon]} />
              </svg>
            </span>
            <span>
              <span className="mb-1 block text-base leading-tight tracking-[-0.01em]">{k.judul}</span>
              <span className="mb-2 block text-[12.5px] leading-snug text-[#46538c]">{k.isi}</span>
              <span className="block font-mono text-[10px] uppercase text-[#6d79a8]">{k.meta}</span>
            </span>
          </a>
        ))}
      </div>
    </>
  );
}
