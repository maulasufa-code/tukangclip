"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const tautan = [
  { href: "#dua-jalur", label: "Dua jalur" },
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#studio", label: "Studio" },
  { href: "#peran", label: "Kreator dan editor" },
  { href: "#keamanan", label: "Keamanan" }
];

const gayaTautan =
  "inline-flex min-h-[44px] items-center rounded-md px-3 text-sm text-cb-tinta-lembut transition-colors duration-200 hover:text-cb-tinta";
const gayaTombolKuning =
  "min-h-[44px] inline-flex items-center justify-center rounded-md bg-kuning px-4 text-sm font-semibold text-kuning-tinta transition-colors duration-200 hover:bg-kuning-tekan";
const gayaTombolGaris =
  "min-h-[44px] inline-flex items-center justify-center rounded-md bg-cb-kabut px-4 text-sm font-medium text-cb-tinta transition-colors duration-200 hover:bg-cb-garis";

export function NavSitus() {
  const [terbuka, setTerbuka] = useState(false);
  const tombol = useRef<HTMLButtonElement>(null);

  // Escape menutup menu dan mengembalikan fokus ke tombolnya.
  useEffect(() => {
    if (!terbuka) return;
    function padaTombol(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setTerbuka(false);
        tombol.current?.focus();
      }
    }
    document.addEventListener("keydown", padaTombol);
    return () => document.removeEventListener("keydown", padaTombol);
  }, [terbuka]);

  return (
    <header className="sticky top-0 z-40 border-b border-cb-garis bg-cb-kertas">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <a href="/" className="flex min-h-[44px] items-center gap-2.5">
          <Image
            src="/marka-tukangclip.png"
            alt=""
            width={240}
            height={134}
            priority
            unoptimized
            className="h-6 w-auto"
          />
          <span className="font-cb-headline text-base font-semibold tracking-tight text-cb-tinta">
            TukangClip
          </span>
        </a>

        <nav aria-label="Bagian halaman" className="hidden items-center gap-1 lg:flex">
          {tautan.map((t) => (
            <a key={t.href} href={t.href} className={gayaTautan}>
              {t.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href="/masuk" className={`${gayaTautan} hidden sm:inline-flex`}>
            Masuk
          </a>
          <a href="/daftar" className={`${gayaTombolKuning} hidden sm:inline-flex`}>
            Buat akun
          </a>
          <button
            ref={tombol}
            type="button"
            onClick={() => setTerbuka((v) => !v)}
            aria-expanded={terbuka}
            aria-controls="menu-situs"
            aria-label={terbuka ? "Tutup menu" : "Buka menu"}
            className="inline-flex h-11 items-center gap-1.5 rounded-md bg-cb-kabut px-3 text-sm text-cb-tinta lg:hidden"
          >
            <IkonMenu terbuka={terbuka} />
            <span>{terbuka ? "Tutup" : "Menu"}</span>
          </button>
        </div>
      </div>

      {terbuka && (
        <nav
          id="menu-situs"
          aria-label="Bagian halaman"
          className="border-t border-cb-garis bg-cb-kertas lg:hidden"
        >
          <ul className="mx-auto max-w-6xl px-5 py-2">
            {tautan.map((t) => (
              <li key={t.href}>
                <a
                  href={t.href}
                  onClick={() => setTerbuka(false)}
                  className="flex min-h-[44px] items-center text-sm text-cb-tinta-lembut"
                >
                  {t.label}
                </a>
              </li>
            ))}
            <li className="mt-2 flex flex-wrap gap-2 border-t border-cb-garis pt-4 pb-2 sm:hidden">
              <a href="/masuk" className={gayaTombolGaris}>
                Masuk
              </a>
              <a href="/daftar" className={gayaTombolKuning}>
                Buat akun
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

/** Dua bar, bukan tiga: mengulang gestur di mark TukangClip. */
function IkonMenu({ terbuka }: { terbuka: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
    >
      {terbuka ? (
        <>
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </>
      ) : (
        <>
          <line x1="4" y1="9" x2="20" y2="9" />
          <line x1="4" y1="15" x2="20" y2="15" />
        </>
      )}
    </svg>
  );
}
