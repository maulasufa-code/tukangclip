"use client";

// Snap.js Midtrans dimuat sekali per halaman. Sandbox dan production memakai skrip yang berbeda.
const SKRIP_SANDBOX = "https://app.sandbox.midtrans.com/snap/snap.js";
const SKRIP_PRODUCTION = "https://app.midtrans.com/snap/snap.js";

type HasilBayar = "sukses" | "menunggu" | "batal" | "gagal";

type SnapGlobal = {
  pay: (
    token: string,
    opsi: {
      onSuccess: () => void;
      onPending: () => void;
      onError: () => void;
      onClose: () => void;
    }
  ) => void;
};

declare global {
  interface Window {
    snap?: SnapGlobal;
  }
}

function muatSkrip(): Promise<void> {
  if (window.snap) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" ? SKRIP_PRODUCTION : SKRIP_SANDBOX;
    s.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "");
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Pembayaran belum bisa dibuka. Coba lagi sebentar."));
    document.head.appendChild(s);
  });
}

/** Buka jendela pembayaran Midtrans. Hasilnya hanya untuk tampilan; saldo tetap dikredit lewat webhook. */
export async function bayarLewatSnap(token: string): Promise<HasilBayar> {
  await muatSkrip();
  return new Promise((resolve) => {
    window.snap?.pay(token, {
      onSuccess: () => resolve("sukses"),
      onPending: () => resolve("menunggu"),
      onError: () => resolve("gagal"),
      onClose: () => resolve("batal")
    });
  });
}
