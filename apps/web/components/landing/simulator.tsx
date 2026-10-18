"use client";

import { useId, useState } from "react";
import { BIAYA_PLATFORM_PERSEN, MINIMAL_RATE, MINIMAL_TOPUP, rincianTopup, rupiah } from "@/lib/harga";

const PILIHAN_BUDGET = [3_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000];

// Simulator ini hanya berhitung: views = budget / rate x 1.000. Tidak ada rata-rata views per klip,
// karena TukangClip belum punya data historisnya.
export function Simulator() {
  const id = useId();
  const [budget, setBudget] = useState(10_000_000);
  const [rate, setRate] = useState("5000");
  // Di bawah minimal dipakai MINIMAL_RATE. Kolom baru dikunci saat keluar dari kolom (onBlur),
  // supaya mengetik "5000" tidak terpotong jadi 1000 di tengah jalan.
  const angkaRate = Math.max(MINIMAL_RATE, Number(rate) || 0);
  const r = rincianTopup(budget);
  const views = Math.floor((budget / angkaRate) * 1000);

  return (
    <div className="grid gap-8 rounded-xl bg-cl-night p-5 text-white sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-6">
        <fieldset>
          <legend className="text-sm text-cl-muted">Budget untuk clipper</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PILIHAN_BUDGET.map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={b === budget}
                onClick={() => setBudget(b)}
                className={`min-h-[44px] rounded-md px-3 text-sm tabular-nums transition-colors ${
                  b === budget ? "bg-cl-accent text-cl-accent-ink" : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {b >= 1_000_000 ? `${b / 1_000_000} jt` : rupiah(b)}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor={`${id}-rate`} className="text-sm text-cl-muted">
            Rate per 1.000 views
          </label>
          <div className="mt-2 flex items-center gap-2">
            <span aria-hidden="true">Rp</span>
            <input
              id={`${id}-rate`}
              type="text"
              inputMode="numeric"
              value={rate}
              onChange={(e) => setRate(e.target.value.replace(/\D/g, "").replace(/^0+/, ""))}
              onBlur={() => setRate(String(angkaRate))}
              className="min-h-[44px] w-40 rounded-md border border-white/20 bg-white/5 px-3 tabular-nums"
            />
          </div>
          <p className="mt-2 text-sm text-cl-muted">
            Kamu yang menentukan rate ini saat membuat kampanye. Minimal Rp{MINIMAL_RATE.toLocaleString("id-ID")}.
          </p>
        </div>
      </div>

      <div aria-live="polite">
        <p className="text-sm text-cl-muted">Perkiraan views yang dibayar</p>
        <p className="mt-1 text-[clamp(40px,6vw,64px)] font-light leading-none tracking-[-0.03em] tabular-nums text-cl-accent">
          {views.toLocaleString("id-ID")}
        </p>
        <dl className="mt-6 grid gap-2 text-sm">
          <Baris n="Budget, 100% ke clipper" v={rupiah(r.budget)} />
          <Baris n={`Biaya platform ${BIAYA_PLATFORM_PERSEN}%`} v={rupiah(r.biaya)} />
          <Baris n="Total dibayar" v={rupiah(r.total)} tebal />
        </dl>
        <p className="mt-4 text-sm text-cl-muted">
          Minimal budget {rupiah(MINIMAL_TOPUP)}. Views di atas batas bayar per klip tidak ikut dibayar, jadi views
          nyata bisa lebih banyak dari angka ini.
        </p>
      </div>
    </div>
  );
}

function Baris({ n, v, tebal = false }: { n: string; v: string; tebal?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 border-t border-white/10 pt-2 ${tebal ? "font-medium" : ""}`}>
      <dt>{n}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}
