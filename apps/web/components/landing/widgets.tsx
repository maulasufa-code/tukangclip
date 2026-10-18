"use client";

import { useState } from "react";

/* ---------- Grafik contoh ---------- */

const DATA = [
  [24, 31, 28, 42, 38, 55, 49, 72],
  [30, 34, 41, 38, 52, 58, 61, 66],
  [18, 20, 26, 22, 30, 41, 36, 52]
];
const METRIK = ["Views", "Watch time", "Shares"];

export function ViewsChart() {
  const [k, setK] = useState(0);
  const d = DATA[k];
  const titik = d.map((v, i) => [30 + i * (360 / 7), 180 - (v - 20) * 2.5] as const);
  const garis = "M" + titik.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");
  const puncak = d.indexOf(Math.max(...d));

  return (
    <figure className="flex w-[88%] flex-col items-center gap-3 max-[560px]:w-[92%]">
      <div role="group" aria-label="Contoh metrik" className="inline-flex gap-0.5 rounded-md bg-white p-[3px] shadow-[0_2px_10px_rgba(31,20,0,0.12)]">
        {METRIK.map((m, i) => (
          <button
            key={m}
            type="button"
            aria-pressed={i === k}
            onClick={() => setK(i)}
            className={`min-h-[44px] rounded px-3 text-xs transition-colors duration-200 ${
              i === k ? "bg-cl-seg text-white" : "text-cl-ink"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 400 210" role="img" aria-label="Contoh grafik performa klip" className="block h-auto w-full">
        <g stroke="#ead9a0" strokeDasharray="3 4">
          <line x1="30" x2="390" y1="30" y2="30" />
          <line x1="30" x2="390" y1="80" y2="80" />
          <line x1="30" x2="390" y1="130" y2="130" />
        </g>
        <path d={`${garis} L390 180 L30 180 Z`} fill="rgba(194,65,12,0.12)" />
        <path d={garis} fill="none" stroke="#c2410c" strokeWidth={2} strokeLinejoin="round" />
        {titik.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={i === puncak ? 5 : 2.5}
            fill={i === puncak ? "#c2410c" : "#fff"}
            stroke="#c2410c"
            strokeWidth={1.5}
          />
        ))}
        <text x="30" y="202" className="font-mono text-[9px]" fill="#6b4f00">POST 1</text>
        <text x="340" y="202" className="font-mono text-[9px]" fill="#6b4f00">POST 8</text>
      </svg>
      <figcaption className="text-center text-[11.5px] text-[#6b4f00]">Contoh tampilan grafik, bukan data nyata.</figcaption>
    </figure>
  );
}
