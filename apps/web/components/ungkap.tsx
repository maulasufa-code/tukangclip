"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Menampilkan isinya saat section masuk viewport.
 * Kalau IntersectionObserver tidak ada, isi langsung tampil.
 * Saat prefers-reduced-motion aktif, kelas .ungkap tidak menghasilkan animasi apa pun.
 */
export function Ungkap({
  children,
  jeda = 0,
  kelas = ""
}: {
  children: React.ReactNode;
  jeda?: number;
  kelas?: string;
}) {
  const wadah = useRef<HTMLDivElement>(null);
  const [tampil, setTampil] = useState(false);

  useEffect(() => {
    const el = wadah.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setTampil(true);
      return;
    }
    const pengamat = new IntersectionObserver(
      (masuk) => {
        if (masuk.some((m) => m.isIntersecting)) {
          setTampil(true);
          pengamat.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);

  return (
    <div
      ref={wadah}
      className={`ungkap${tampil ? " ungkap-tampil" : ""}${kelas ? ` ${kelas}` : ""}`}
      style={jeda ? { transitionDelay: `${jeda}ms` } : undefined}
    >
      {children}
    </div>
  );
}
