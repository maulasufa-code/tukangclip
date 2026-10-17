"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const tautan = [
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#peran", label: "Peran" },
  { href: "#keamanan", label: "Keamanan" },
  { href: "#status", label: "Status" }
];

/**
 * Header sembunyi saat turun dan muncul lagi saat naik. Warnanya berganti
 * saat berada di atas panel terang, supaya teks tetap terbaca.
 */
export function HeaderNav() {
  const [sembunyi, setSembunyi] = useState(false);
  const [terang, setTerang] = useState(false);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    function periksa() {
      frame = 0;
      const y = window.scrollY;
      setSembunyi(y > lastY && y > 200);
      lastY = y;

      const tengah = (header.current?.offsetHeight ?? 60) / 2;
      const adaPanel = Array.from(document.querySelectorAll<HTMLElement>("[data-panel]")).some((p) => {
        const r = p.getBoundingClientRect();
        return r.top < tengah && r.bottom > tengah;
      });
      setTerang(adaPanel);
    }

    function padaScroll() {
      if (!frame) frame = requestAnimationFrame(periksa);
    }

    periksa();
    window.addEventListener("scroll", padaScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", padaScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      ref={header}
      className={`fixed inset-x-0 top-0 z-50 px-4 transition-transform duration-300 ease-[cubic-bezier(.645,.045,.355,1)] sm:px-6 ${
        sembunyi ? "-translate-y-[110%]" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 py-3.5">
        <Link
          href="/"
          className={`flex min-h-[44px] items-center gap-2.5 text-[19px] tracking-[-0.01em] ${terang ? "text-cl-ink" : "text-white"}`}
        >
          <Penanda terang={terang} />
          TukangClip
        </Link>

        <div className="flex items-center gap-2">
          <nav aria-label="Bagian halaman" className="hidden lg:block">
            <ul
              className={`flex gap-0.5 rounded-lg p-1 font-mono text-[11.5px] uppercase backdrop-blur-md ${
                terang ? "bg-cl-slate/90 text-cl-ink" : "bg-white/10 text-white"
              }`}
            >
              {tautan.map((t) => (
                <li key={t.href}>
                  <a
                    href={t.href}
                    className={`inline-flex min-h-[44px] items-center rounded px-3 transition-colors ${
                      terang ? "hover:bg-cl-ink/10" : "hover:bg-white/10"
                    }`}
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href="/masuk"
            className="hidden min-h-[44px] items-center justify-center rounded-[7px] bg-cl-slate px-4 font-mono text-xs uppercase text-cl-ink transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            Masuk
          </Link>
          <Link
            href="/daftar"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[7px] bg-cl-accent px-4 font-mono text-xs uppercase text-cl-accent-ink transition-transform hover:-translate-y-0.5 hover:bg-cl-accent-hi"
          >
            Buat akun
          </Link>
        </div>
      </div>
    </header>
  );
}

function Penanda({ terang }: { terang: boolean }) {
  const warna = terang ? "bg-cl-ink" : "bg-cl-accent";
  const tinggi = ["h-[6px]", "h-4", "h-[11px]", "h-[6px]"];
  return (
    <span aria-hidden="true" className="flex items-center gap-[2.5px] h-[18px]">
      {tinggi.map((t, i) => (
        <i key={i} className={`block w-[3px] rounded-[1px] ${t} ${warna}`} />
      ))}
    </span>
  );
}
