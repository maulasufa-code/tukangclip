import { KepalaAplikasi, type Butir } from "@/components/kepala-aplikasi";
import type { Peran } from "@/lib/sesi";

const TAUTAN_BERSAMA: Butir[] = [
  { href: "/akun", label: "Akun sosial" },
  { href: "/keamanan", label: "Keamanan" }
];

const TAUTAN: Record<Peran | "tamu", Butir[]> = {
  editor: [
    { href: "/dasbor", label: "Dasbor" },
    { href: "/pasar", label: "Cari kampanye" },
    { href: "/kerjaanku", label: "Kerjaanku" },
    ...TAUTAN_BERSAMA
  ],
  creator: [
    { href: "/dasbor", label: "Dasbor" },
    { href: "/kampanye/baru", label: "Kampanye baru" },
    { href: "/unggah", label: "Unggah" },
    { href: "/kredit", label: "Kredit AI" },
    ...TAUTAN_BERSAMA
  ],
  admin: [
    { href: "/dasbor", label: "Dasbor" },
    { href: "/kampanye/baru", label: "Kampanye baru" },
    { href: "/pasar", label: "Pasar" },
    { href: "/unggah", label: "Unggah" },
    { href: "/kredit", label: "Kredit AI" },
    ...TAUTAN_BERSAMA
  ],
  tamu: [{ href: "/jelajah", label: "Kampanye" }]
};

const NAMA_PERAN: Record<Peran, string> = {
  editor: "Clipper",
  creator: "Kreator",
  admin: "Admin"
};

export function Kerangka({
  children,
  pengguna
}: {
  children: React.ReactNode;
  pengguna: { nama: string; email: string; peran: Peran } | null;
}) {
  return (
    <>
      <KepalaAplikasi
        butir={TAUTAN[pengguna?.peran ?? "tamu"]}
        pengguna={
          pengguna
            ? { nama: pengguna.nama || pengguna.email, peranLabel: NAMA_PERAN[pengguna.peran] }
            : null
        }
      />
      <main id="isi" className="min-h-[60vh]">
        {children}
      </main>
      <footer className="gelap bg-cl-night text-cl-muted">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-4 text-sm sm:px-6">
          <a href="/" className="inline-flex min-h-[44px] items-center text-white">
            TukangClip
          </a>
          <a href="/jelajah" className="inline-flex min-h-[44px] items-center hover:text-white">
            Semua kampanye terbuka
          </a>
        </div>
      </footer>
    </>
  );
}
