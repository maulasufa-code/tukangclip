"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Animasi masuk pakai GSAP. Elemen tetap terlihat tanpa JS atau saat
 * prefers-reduced-motion aktif, karena animasi hanya dibuat di dalam efek ini.
 * Dengan `kata`, yang naik adalah tiap `.cl-word` di dalamnya (lihat Words).
 */
export function Reveal({
  children,
  delay = 0,
  kata = false,
  className = ""
}: {
  children: ReactNode;
  delay?: number;
  kata?: boolean;
  className?: string;
}) {
  const wadah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wadah.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tween = kata
      ? gsap.from(el.querySelectorAll(".cl-word"), {
          yPercent: 110,
          duration: 1,
          ease: "power3.out",
          stagger: 0.055,
          delay,
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        })
      : gsap.from(el, {
          opacity: 0,
          y: 26,
          filter: "blur(8px)",
          duration: 0.9,
          ease: "power3.out",
          delay,
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay, kata]);

  return (
    <div ref={wadah} className={className}>
      {children}
    </div>
  );
}
