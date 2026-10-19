"use client";

import { useEffect } from "react";

// Saat jendela atau layar melewati breakpoint, elemen yang ikut berpindah posisi
// bergeser dari posisi lama ke posisi baru. Animasi memakai properti `translate`,
// jadi tidak bentrok dengan `transform` yang dipakai GSAP dan efek hover.

const TITIK = [640, 768, 980, 1024, 1280];
const DURASI = 520;
const MAKS = 400;
const PILIH = '[class*="grid-cols"] > *, [class*="flex-col"] > *, [class*="flex-row"] > *';

type Posisi = { x: number; y: number };

function kunci(lebar: number) {
  return TITIK.filter((t) => lebar >= t).length;
}

function ambilElemen(): HTMLElement[] {
  const hasil: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>(PILIH).forEach((el) => {
    if (hasil.length >= MAKS) return;
    const pos = getComputedStyle(el).position;
    if (pos === "fixed" || pos === "sticky") return;
    hasil.push(el);
  });
  return hasil;
}

function geser(el: HTMLElement): Posisi {
  const t = getComputedStyle(el).translate;
  if (!t || t === "none") return { x: 0, y: 0 };
  const [a, b] = t.split(" ");
  return { x: parseFloat(a) || 0, y: parseFloat(b) || 0 };
}

/** Posisi dokumen elemen tanpa pengaruh animasi yang sedang berjalan. */
function posisiDasar(el: HTMLElement): Posisi | null {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  const t = geser(el);
  return { x: r.left + window.scrollX - t.x, y: r.top + window.scrollY - t.y };
}

export function ReflowAnimasi() {
  useEffect(() => {
    let elemen: HTMLElement[] = [];
    let terakhirCari = 0;
    let dasar = new Map<HTMLElement, Posisi>();
    let kunciSekarang = kunci(window.innerWidth);
    let frame = 0;
    let timer: number | undefined;
    let aktif: HTMLElement[] = [];

    function rekam(t: number) {
      if (t - terakhirCari > 1000 || elemen.length === 0) {
        elemen = ambilElemen();
        terakhirCari = t;
      }
      const baru = new Map<HTMLElement, Posisi>();
      for (const el of elemen) {
        const p = posisiDasar(el);
        if (p) baru.set(el, p);
      }
      dasar = baru;
      frame = requestAnimationFrame(rekam);
    }

    function animasi() {
      // Posisi tampak sekarang, termasuk animasi yang belum selesai.
      const lama = new Map<HTMLElement, Posisi>();
      dasar.forEach((p, el) => {
        const t = geser(el);
        lama.set(el, { x: p.x + t.x, y: p.y + t.y });
      });

      // Hapus geseran lama, lalu ukur posisi baru dari layout yang sudah berubah.
      const semua: HTMLElement[] = [];
      dasar.forEach((_, el) => semua.push(el));
      for (const el of semua) {
        el.style.transition = "none";
        el.style.translate = "";
      }
      const baru = new Map<HTMLElement, Posisi>();
      for (const el of semua) {
        const p = posisiDasar(el);
        if (p) baru.set(el, p);
      }

      // Geser setiap elemen ke posisi lamanya tanpa transisi, lalu lepas dengan transisi.
      aktif = [];
      baru.forEach((p, el) => {
        const dari = lama.get(el);
        if (!dari) return;
        const dx = dari.x - p.x;
        const dy = dari.y - p.y;
        if (Math.abs(dx) + Math.abs(dy) < 1) return;
        el.style.translate = `${dx}px ${dy}px`;
        aktif.push(el);
      });
      void document.body.offsetHeight;
      for (const el of aktif) {
        el.style.transition = `translate ${DURASI}ms cubic-bezier(.2,.7,.2,1)`;
        el.style.translate = "0px 0px";
      }

      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        for (const el of aktif) {
          el.style.transition = "";
          el.style.translate = "";
        }
        aktif = [];
      }, DURASI + 40);
    }

    function saatUkuran() {
      const k = kunci(window.innerWidth);
      if (k === kunciSekarang) return;
      kunciSekarang = k;
      animasi();
    }

    frame = requestAnimationFrame(rekam);
    window.addEventListener("resize", saatUkuran);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", saatUkuran);
    };
  }, []);

  return null;
}
