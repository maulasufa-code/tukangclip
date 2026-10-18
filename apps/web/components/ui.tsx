import type { ReactNode } from "react";

// Kelas bersama halaman aplikasi. Nilai warna mengikuti DESIGN.md (kuning logo + cokelat hangat).
const dasarTombol =
  "inline-flex min-h-[44px] items-center justify-center rounded-[7px] px-5 font-mono text-xs uppercase transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60";

export const tombolPrimer = `${dasarTombol} bg-cl-accent text-cl-accent-ink hover:bg-cl-accent-hi`;
export const tombolSekunder = `${dasarTombol} bg-cl-slate text-cl-ink`;
export const tombolGelap = `${dasarTombol} bg-white/10 text-white hover:bg-white/20`;
export const tombolGaris = `${dasarTombol} border-2 border-cl-ink text-cl-ink hover:bg-cl-ink hover:text-white`;
export const tombolBahaya = `${dasarTombol} border-2 border-red-800 text-red-900 hover:bg-red-800 hover:text-white`;

export const isian =
  "mt-1.5 w-full min-h-[44px] rounded-[7px] border-2 border-stone-300 bg-white px-3 text-cl-ink placeholder:text-stone-400";
export const label = "block text-sm font-medium";
export const kartu = "rounded-lg border border-stone-200 bg-white";

/** Satu lajur isi halaman, lebarnya sama dengan header supaya tepinya sejajar. */
export function Isi({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto max-w-[1100px] px-4 py-8 sm:px-6 sm:py-12 ${className}`}>{children}</div>
  );
}

/**
 * Kepala halaman gelap yang menyambung dengan header. Garis perforasi di dasarnya
 * memakai motif roll film dari landing, penanda bahwa ini bahan baku klip.
 */
export function KepalaHalaman({
  id,
  penanda,
  judul,
  deskripsi,
  aksi
}: {
  id: string;
  penanda: string;
  judul: ReactNode;
  deskripsi?: ReactNode;
  aksi?: ReactNode;
}) {
  return (
    <div className="gelap bg-cl-night text-cl-paper">
      <div className="mx-auto max-w-[1100px] px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
        <p className="font-mono text-xs uppercase text-cl-accent">{penanda}</p>
        <h1
          id={id}
          className="mt-3 max-w-3xl font-display text-3xl font-light leading-[1.1] tracking-[-0.02em] sm:text-5xl"
        >
          {judul}
        </h1>
        {deskripsi && <p className="mt-4 max-w-2xl text-cl-muted">{deskripsi}</p>}
        {aksi && <div className="mt-7 flex flex-wrap gap-2.5">{aksi}</div>}
      </div>
      <div
        aria-hidden="true"
        className="h-2.5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(252,197,1,.5) 0 12px, transparent 12px 26px)"
        }}
      />
    </div>
  );
}

const nadaChip = {
  aktif: "bg-cl-sun text-cl-ink",
  netral: "bg-cl-slate text-cl-ink",
  bahaya: "bg-red-100 text-red-900"
};

/** Penanda status nyata (bukan hiasan): label dan warnanya mengikuti data. */
export function Chip({ nada = "netral", children }: { nada?: keyof typeof nadaChip; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-[5px] px-2 py-1 font-mono text-xs uppercase ${nadaChip[nada]}`}>
      {children}
    </span>
  );
}

/** Keadaan kosong atau gagal: sebut sebabnya, lalu beri satu langkah berikutnya. */
export function Kosong({
  children,
  gagal = false
}: {
  children: ReactNode;
  gagal?: boolean;
}) {
  return (
    <div
      role={gagal ? "alert" : undefined}
      className="rounded-lg border-2 border-dashed border-stone-300 p-5 text-sm text-stone-700"
    >
      {children}
    </div>
  );
}

export function Judul2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="font-display text-2xl font-light tracking-[-0.01em]">
      {children}
    </h2>
  );
}

const rp = new Intl.NumberFormat("id-ID");

export function angka(n: number) {
  return rp.format(n);
}

export function tanggal(iso: string | null | undefined) {
  return iso
    ? new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
    : "";
}

/** Sisa waktu menuju tenggat, dalam bahasa orang: "2 hari 4 jam" atau "lewat tenggat". */
export function sisaWaktu(iso: string | null | undefined, sekarang = Date.now()) {
  if (!iso) return null;
  const ms = Date.parse(iso) - sekarang;
  if (ms <= 0) return { teks: "Lewat tenggat", lewat: true };
  const jam = Math.floor(ms / 3_600_000);
  const hari = Math.floor(jam / 24);
  return {
    teks: hari > 0 ? `${hari} hari ${jam % 24} jam lagi` : `${jam} jam lagi`,
    lewat: false
  };
}
