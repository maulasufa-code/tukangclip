"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { KeluarButton } from "@/components/keluar-button";

export type Butir = { href: string; label: string };

type Props = {
  butir: Butir[];
  pengguna: { nama: string; peranLabel: string } | null;
};

const tombolAksen =
  "inline-flex min-h-[44px] items-center justify-center rounded-[7px] bg-cl-accent px-4 font-mono text-xs uppercase text-cl-accent-ink transition-transform hover:-translate-y-0.5 hover:bg-cl-accent-hi";

/**
 * Header aplikasi: tautan mengikuti peran, halaman aktif ditandai, dan di layar sempit
 * tautan pindah ke panel yang bisa ditutup dengan Escape.
 */
export function KepalaAplikasi({ butir, pengguna }: Props) {
  const path = usePathname();
  const [buka, setBuka] = useState(false);

  useEffect(() => setBuka(false), [path]);
  useEffect(() => {
    if (!buka) return;
    const tutup = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    window.addEventListener("keydown", tutup);
    return () => window.removeEventListener("keydown", tutup);
  }, [buka]);

  const aktif = (href: string) => path === href || path.startsWith(href + "/");
  const huruf = (pengguna?.nama || "?").trim().charAt(0).toUpperCase();

  return (
    <header className="gelap sticky top-0 z-40 bg-cl-night text-white">
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-[7px] focus:bg-cl-accent focus:px-4 focus:py-3 focus:text-cl-accent-ink"
      >
        Lewati ke isi halaman
      </a>
      <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-2 sm:px-6">
        <Link
          href={pengguna ? "/dasbor" : "/"}
          className="flex min-h-[44px] shrink-0 items-center gap-2.5 text-[19px] tracking-[-0.01em]"
        >
          <Logo className="h-[22px] w-auto text-cl-accent" />
          TukangClip
        </Link>

        <nav aria-label="Utama" className="ml-4 hidden flex-1 lg:block">
          <ul className="flex gap-0.5">
            {butir.map((b) => (
              <li key={b.href}>
                <Link
                  href={b.href}
                  aria-current={aktif(b.href) ? "page" : undefined}
                  className={`inline-flex min-h-[44px] items-center rounded-[7px] px-3 font-mono text-[11.5px] uppercase transition-colors ${
                    aktif(b.href)
                      ? "bg-cl-accent text-cl-accent-ink"
                      : "text-cl-muted hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {b.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {pengguna ? (
            <>
              <div className="flex items-center gap-2.5" title={pengguna.nama}>
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 place-items-center rounded-[7px] bg-white/10 font-mono text-sm text-cl-accent"
                >
                  {huruf}
                </span>
                <span className="leading-tight">
                  <span className="block max-w-[140px] truncate text-sm">{pengguna.nama}</span>
                  <span className="block font-mono text-[11px] uppercase text-cl-muted">
                    {pengguna.peranLabel}
                  </span>
                </span>
              </div>
              <KeluarButton className="inline-flex min-h-[44px] items-center rounded-[7px] px-3 font-mono text-[11.5px] uppercase text-cl-muted hover:bg-white/10 hover:text-white" />
            </>
          ) : (
            <>
              <Link
                href="/masuk"
                className="inline-flex min-h-[44px] items-center rounded-[7px] px-3 font-mono text-[11.5px] uppercase text-cl-muted hover:bg-white/10 hover:text-white"
              >
                Masuk
              </Link>
              <Link href="/daftar" className={tombolAksen}>
                Buat akun
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-expanded={buka}
          aria-controls="menu-aplikasi"
          onClick={() => setBuka(!buka)}
          className="ml-auto inline-flex min-h-[44px] items-center rounded-[7px] bg-white/10 px-4 font-mono text-xs uppercase lg:hidden"
        >
          {buka ? "Tutup" : "Menu"}
        </button>
      </div>

      {buka && (
        <div id="menu-aplikasi" className="border-t border-white/10 lg:hidden">
          <nav aria-label="Menu utama" className="mx-auto max-w-[1100px] px-4 py-3 sm:px-6">
            <ul>
              {butir.map((b) => (
                <li key={b.href}>
                  <Link
                    href={b.href}
                    aria-current={aktif(b.href) ? "page" : undefined}
                    className={`flex min-h-[48px] items-center border-b border-white/10 font-mono text-sm uppercase ${
                      aktif(b.href) ? "text-cl-accent" : "text-white"
                    }`}
                  >
                    {b.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 py-3">
              {pengguna ? (
                <>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-sm">{pengguna.nama}</span>
                    <span className="block font-mono text-[11px] uppercase text-cl-muted">
                      {pengguna.peranLabel}
                    </span>
                  </span>
                  <KeluarButton className="inline-flex min-h-[44px] items-center rounded-[7px] bg-white/10 px-4 font-mono text-xs uppercase" />
                </>
              ) : (
                <>
                  <Link href="/masuk" className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase">
                    Masuk
                  </Link>
                  <Link href="/daftar" className={tombolAksen}>
                    Buat akun
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
