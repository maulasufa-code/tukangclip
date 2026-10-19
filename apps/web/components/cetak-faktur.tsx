"use client";

import { tombolPrimer } from "@/components/ui";

export function CetakFaktur() {
  return (
    <button type="button" onClick={() => window.print()} className={`${tombolPrimer} print:hidden`}>
      Cetak faktur
    </button>
  );
}
