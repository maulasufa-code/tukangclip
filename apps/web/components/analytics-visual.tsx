"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { rupiah } from "@/lib/harga";

export type Titik = { date: string; views: number; likes: number; comments: number };

const angkaId = new Intl.NumberFormat("id-ID");
const ringkas = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
const tgl = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

/**
 * Membungkus bagian yang punya gerak masuk. Gerak baru jalan saat bagian ini terlihat di layar
 * (atau setelah 1,5 detik, kalau pengamat tidak pernah terpicu, misalnya tab latar).
 */
export function GerakMasuk({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lihat, setLihat] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLihat(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    const cadangan = window.setTimeout(() => setLihat(true), 1500);
    return () => {
      io.disconnect();
      window.clearTimeout(cadangan);
    };
  }, []);
  return (
    <div ref={ref} data-lihat={lihat ? "1" : "0"} className={className}>
      {children}
    </div>
  );
}

/**
 * Angka yang menghitung naik sekali dari 0. Pembaca layar langsung mendapat nilai akhirnya.
 * `uang` memakai format rupiah. Fungsi tidak bisa dikirim dari server ke komponen klien, jadi pilihannya lewat boolean.
 */
export function AngkaNaik({ nilai, uang = false }: { nilai: number; uang?: boolean }) {
  const format = (n: number) => (uang ? rupiah(n) : angkaId.format(n));
  const [tampil, setTampil] = useState(nilai);
  useEffect(() => {
    if (nilai === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTampil(nilai);
      return;
    }
    const mulai = performance.now();
    let raf = 0;
    const langkah = (t: number) => {
      const p = Math.min(1, (t - mulai) / 900);
      setTampil(Math.round(nilai * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(langkah);
    };
    raf = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(raf);
  }, [nilai]);
  return (
    <>
      <span className="sr-only">{format(nilai)}</span>
      <span aria-hidden="true" className="tabular-nums">
        {format(tampil)}
      </span>
    </>
  );
}

const METRIK = [
  { kunci: "views", label: "Views" },
  { kunci: "likes", label: "Like" },
  { kunci: "comments", label: "Komentar" }
] as const;
type Kunci = (typeof METRIK)[number]["kunci"];

const W = 680;
const H = 300;
const KIRI = 56;
const KANAN = 16;
const ATAS = 24;
const BAWAH = 36;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Batas atas sumbu yang bulat (1, 2, 5 x 10^k) supaya garis kisi berangka rapi. */
function batasAtas(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

/**
 * Garis halus lewat semua titik (kubik Hermite, tangen harmonik). Tangen dibatasi supaya kurva
 * tidak melewati titik tertinggi atau terendah, jadi data kumulatif tidak terlihat turun palsu.
 */
function jalurHalus(p: [number, number][]): string {
  const n = p.length;
  if (n === 0) return "";
  if (n === 1) return `M${p[0][0]} ${p[0][1]}`;
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = p[i + 1][0] - p[i][0] || 1;
    m.push((p[i + 1][1] - p[i][1]) / dx);
  }
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0 ? 0 : (2 * m[i - 1] * m[i]) / (m[i - 1] + m[i]);
  }
  let d = `M${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (p[i + 1][0] - p[i][0]) / 3;
    const c1x = p[i][0] + dx;
    const c1y = p[i][1] + t[i] * dx;
    const c2x = p[i + 1][0] - dx;
    const c2y = p[i + 1][1] - t[i + 1] * dx;
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p[i + 1][0].toFixed(2)} ${p[i + 1][1].toFixed(2)}`;
  }
  return d;
}

/**
 * Grafik tren satu metrik. Garis tumbuh dari sumbu saat masuk layar, lalu berpindah bentuk
 * (morph) kalau metrik diganti. Hover menggeser penanda dan tooltip dengan transisi, tidak lompat.
 */
export function GrafikPeriode({ series, rentang }: { series: Titik[]; rentang: string }) {
  const [kunci, setKunci] = useState<Kunci>("views");
  const [aktif, setAktif] = useState<number | null>(null);
  const [siap, setSiap] = useState(false);
  const [lihat, setLihat] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gradId = useId();
  const n = series.length;
  const nilai = series.map((t) => t[kunci]);
  const maks = batasAtas(Math.max(...nilai, 0));
  const lebar = W - KIRI - KANAN;
  const tinggi = H - ATAS - BAWAH;
  const dasar = ATAS + tinggi;
  const x = (i: number) => KIRI + (n <= 1 ? lebar / 2 : (i / (n - 1)) * lebar);
  const y = (v: number) => ATAS + tinggi - (v / maks) * tinggi;

  // Garis mulai dari sumbu lalu naik. Transisi dipasang setelah frame pertama supaya tidak langsung loncat.
  useEffect(() => {
    const id = requestAnimationFrame(() => setSiap(true));
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLihat(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    const cadangan = window.setTimeout(() => setLihat(true), 1500);
    return () => {
      io.disconnect();
      window.clearTimeout(cadangan);
    };
  }, []);

  const tampilkan = siap && lihat;
  const titik: [number, number][] = series.map((_, i) => [x(i), tampilkan ? y(nilai[i]) : dasar]);
  const garis = jalurHalus(titik);
  const area = n > 0 ? `${garis} L${x(n - 1).toFixed(2)} ${dasar} L${x(0).toFixed(2)} ${dasar} Z` : "";
  const label = METRIK.find((m) => m.kunci === kunci)!.label;
  const kosong = Math.max(...nilai) === 0;
  const akhir = n > 0 ? n - 1 : 0;
  const fokus = aktif ?? akhir;
  const t = aktif === null ? null : series[aktif];
  const tambah = t && aktif !== null && aktif > 0 ? t[kunci] - series[aktif - 1][kunci] : 0;

  function geser(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setAktif(Math.min(n - 1, Math.max(0, Math.round(((px - KIRI) / lebar) * (n - 1)))));
  }

  function tombol(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") setAktif((a) => Math.max(0, (a ?? n) - 1));
    else if (e.key === "ArrowRight") setAktif((a) => Math.min(n - 1, (a ?? -1) + 1));
    else if (e.key === "Home") setAktif(0);
    else if (e.key === "End") setAktif(n - 1);
    else if (e.key === "Escape") setAktif(null);
    else return;
    e.preventDefault();
  }

  const persen = (x(fokus) / W) * 100;
  const transisi = `transform 520ms ${EASE}`;

  return (
    <div ref={wrapRef} data-lihat={lihat ? "1" : "0"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-700">
          {label} kumulatif, {rentang}
        </p>
        <div role="group" aria-label="Metrik grafik" className="flex gap-1">
          {METRIK.map((m) => (
            <button
              key={m.kunci}
              type="button"
              aria-pressed={kunci === m.kunci}
              onClick={() => setKunci(m.kunci)}
              className={`inline-flex min-h-[44px] items-center rounded-full px-4 font-mono text-xs uppercase transition-colors duration-300 ${
                kunci === m.kunci ? "bg-cl-ink text-cl-paper" : "bg-cl-slate text-cl-ink hover:bg-cl-sun"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-6">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          tabIndex={0}
          aria-label={`Grafik ${label.toLowerCase()} kumulatif, ${rentang}. Gunakan panah kiri dan kanan untuk membaca per hari.`}
          className="w-full touch-pan-y overflow-visible"
          // Klik tidak memberi fokus, jadi tidak ada cincin oranye. Tab dengan keyboard tetap memberi fokus.
          onMouseDown={(e) => e.preventDefault()}
          onPointerMove={geser}
          onPointerLeave={() => setAktif(null)}
          onKeyDown={tombol}
          onFocus={() => setAktif((a) => a ?? akhir)}
          onBlur={() => setAktif(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c2410c" stopOpacity="0.28" />
              <stop offset="70%" stopColor="#c2410c" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#c2410c" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((i) => {
            const v = (maks / 4) * i;
            return (
              <g key={i} style={{ opacity: tampilkan ? 1 : 0, transition: `opacity 600ms ${EASE} ${i * 70}ms` }}>
                <line x1={KIRI} x2={W - KANAN} y1={y(v)} y2={y(v)} stroke="#1f1400" strokeOpacity={0.1} strokeWidth={1} />
                <text x={KIRI - 10} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#4a3600" fontFamily="var(--font-mono), monospace">
                  {ringkas.format(v)}
                </text>
              </g>
            );
          })}

          {[0, Math.floor((n - 1) / 2), n - 1].map((i, k) =>
            n > 0 ? (
              <text
                key={i}
                x={x(i)}
                y={H - 10}
                textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}
                fontSize={11}
                fill="#4a3600"
                fontFamily="var(--font-mono), monospace"
              >
                {tgl(series[i].date)}
              </text>
            ) : null
          )}

          <path
            d={area}
            fill={`url(#${gradId})`}
            style={{ d: `path("${area}")`, transition: `d 900ms ${EASE}` }}
          />
          <path
            d={garis}
            fill="none"
            stroke="#c2410c"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ d: `path("${garis}")`, transition: `d 900ms ${EASE}` }}
          />

          {n > 0 && (
            <g pointerEvents="none" style={{ transform: `translate(${x(fokus)}px, ${y(nilai[fokus])}px)`, transition: transisi }}>
              <circle r={9} fill="#c2410c" fillOpacity={0.15} />
              <circle r={4.5} fill="#c2410c" stroke="#fffdf6" strokeWidth={2} />
            </g>
          )}

          {aktif !== null && n > 0 && (
            <g pointerEvents="none" style={{ transform: `translate(${x(aktif)}px, 0px)`, transition: transisi }}>
              <line x1={0} x2={0} y1={ATAS} y2={dasar} stroke="#1f1400" strokeOpacity={0.35} strokeWidth={1} strokeDasharray="3 4" />
            </g>
          )}
        </svg>

        {t && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 min-w-[160px] rounded-[12px] bg-cl-night p-3.5 text-sm text-cl-paper shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
            style={{
              left: `${persen}%`,
              transform: persen < 20 ? "translateX(12px)" : persen > 80 ? "translateX(calc(-100% - 12px))" : "translateX(-50%)",
              transition: `left 520ms ${EASE}, transform 300ms ${EASE}`
            }}
          >
            <p className="font-mono text-[11px] uppercase text-cl-accent">{tgl(t.date)}</p>
            <p className="mt-1.5 text-lg font-light tabular-nums">{angkaId.format(t[kunci])}</p>
            <p className="mt-0.5 text-xs text-cl-muted tabular-nums">
              {tambah >= 0 ? "+" : ""}
              {angkaId.format(tambah)} dari hari sebelumnya
            </p>
          </div>
        )}
      </div>

      {kosong && (
        <p className="mt-3 text-sm text-stone-700">
          Belum ada {label.toLowerCase()} tercatat di periode ini. Angka muncul setelah pembacaan harian pertama.
        </p>
      )}

      <details className="mt-4">
        <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-mono text-xs uppercase underline underline-offset-4">
          Lihat sebagai tabel
        </summary>
        <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-stone-200">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-cl-slate">
              <tr>
                <th scope="col" className="p-2 font-medium">Tanggal</th>
                <th scope="col" className="p-2 text-right font-medium">Views</th>
                <th scope="col" className="p-2 text-right font-medium">Like</th>
                <th scope="col" className="p-2 text-right font-medium">Komentar</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.date} className="border-t border-stone-200">
                  <th scope="row" className="p-2 font-normal">{tgl(s.date)}</th>
                  <td className="p-2 text-right tabular-nums">{angkaId.format(s.views)}</td>
                  <td className="p-2 text-right tabular-nums">{angkaId.format(s.likes)}</td>
                  <td className="p-2 text-right tabular-nums">{angkaId.format(s.comments)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/**
 * Pilih rentang lewat kalender (input tanggal bawaan browser) atau preset. Formulir GET biasa,
 * jadi tetap jalan tanpa JavaScript dan halaman dihitung ulang di server.
 */
export function FilterAnalytics({
  dari,
  sampai,
  maks,
  kampanye,
  pilihan,
  preset
}: {
  dari: string;
  sampai: string;
  maks: string;
  kampanye: string;
  pilihan: { id: string; title: string }[];
  preset: { label: string; dari: string; sampai: string }[];
}) {
  const kelas =
    "min-h-[44px] rounded-[7px] border border-white/30 bg-cl-night px-3 text-sm text-white [color-scheme:dark]";
  return (
    <div className="flex w-full flex-col gap-3">
      <div role="group" aria-label="Preset periode" className="flex flex-wrap gap-1">
        {preset.map((p) => (
          <a
            key={p.label}
            href={`/analytics?from=${p.dari}&to=${p.sampai}${kampanye ? `&kampanye=${encodeURIComponent(kampanye)}` : ""}`}
            className={`inline-flex min-h-[44px] items-center rounded-[7px] px-4 font-mono text-xs uppercase transition-colors ${
              p.dari === dari && p.sampai === sampai
                ? "bg-cl-accent text-cl-accent-ink"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {p.label}
          </a>
        ))}
      </div>
      <form method="get" action="/analytics" className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs uppercase text-cl-muted">
          Dari
          <input type="date" name="from" defaultValue={dari} max={maks} className={kelas} />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase text-cl-muted">
          Sampai
          <input type="date" name="to" defaultValue={sampai} max={maks} className={kelas} />
        </label>
        {pilihan.length > 1 && (
          <label className="flex flex-col gap-1 text-xs uppercase text-cl-muted">
            Kampanye
            <select name="kampanye" defaultValue={kampanye} className={`${kelas} max-w-[260px]`}>
              <option value="">Semua kampanye</option>
              {pilihan.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center rounded-[7px] bg-cl-accent px-5 font-mono text-xs uppercase text-cl-accent-ink hover:bg-cl-accent-hi"
        >
          Terapkan
        </button>
      </form>
    </div>
  );
}
