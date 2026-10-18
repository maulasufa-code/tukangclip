"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Scroll halus untuk seluruh halaman: roda mouse, gulir panjang, dan lompatan
 * ke anchor. Offset -80 menjaga target tidak tertutup header.
 */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.9,
      // Tanpa ini, Lenis membuat lompatan langsung saat setting gerak-berkurang aktif di OS.
      respectReducedMotion: false,
      anchors: { offset: -80, duration: 1.4 }
    });

    let frame = 0;
    function loop(waktu: number) {
      lenis.raf(waktu);
      frame = requestAnimationFrame(loop);
    }
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
