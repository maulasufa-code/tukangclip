// Harga kampanye. Sumber hitungan: docs/harga-kampanye.md.
// Backend membaca nilai yang sama dari tabel settings (campaign_fee_pct, min_campaign_topup_idr).
// ponytail: angka disalin di dua tempat; ambil dari API kalau harga mulai sering berubah.
export const BIAYA_PLATFORM_PERSEN = 15;
export const MINIMAL_TOPUP = 3_000_000;
// Rate per 1.000 views di bawah ini tidak masuk akal dan tidak akan dilamar clipper.
export const MINIMAL_RATE = 1_000;

export function rincianTopup(budget: number) {
  const biaya = Math.floor((budget * BIAYA_PLATFORM_PERSEN) / 100);
  return { budget, biaya, total: budget + biaya };
}

export function rupiah(n: number) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}
