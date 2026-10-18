"use client";

import { useEffect, useState } from "react";

/**
 * Daftar langkah di kiri. Langkah yang aktif mengikuti blok `[data-step]`
 * yang sedang melewati tengah layar di sisi kanan.
 */
export function StepList({ items }: { items: string[] }) {
  const [aktif, setAktif] = useState(0);

  useEffect(() => {
    const blok = Array.from(document.querySelectorAll<HTMLElement>("[data-step]"));
    const pengamat = new IntersectionObserver(
      (masuk) => {
        masuk.forEach((m) => {
          if (m.isIntersecting) setAktif(Number((m.target as HTMLElement).dataset.step));
        });
      },
      { rootMargin: "-35% 0px -45% 0px" }
    );
    blok.forEach((b) => pengamat.observe(b));
    return () => pengamat.disconnect();
  }, []);

  return (
    <ol className="m-0 p-0 text-[clamp(22px,2.3vw,32px)] font-light leading-[1.2] tracking-[-0.025em]">
      {items.map((t, i) => (
        <li
          key={t}
          aria-current={i === aktif ? "step" : undefined}
          className={`py-px transition-colors duration-500 ${
            i === aktif ? "text-cl-ink" : "text-[#5c4300]"
          } ${i === aktif ? "font-normal" : ""} max-[980px]:text-cl-ink`}
        >
          <a href={`#langkah-${i}`} className="block rounded-sm hover:text-cl-rust focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cl-ink">
            {t}
          </a>
        </li>
      ))}
    </ol>
  );
}
