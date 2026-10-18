# Harga jual dan HPP kampanye

Dokumen ini menghitung biaya platform untuk kampanye clipping, dan menjadi sumber angka di landing dan
di backend. Angka biaya Xendit diambil dari halaman biaya Xendit Indonesia (xendit.co/id/biaya) pada
18 Oktober 2026. Angka lain adalah **asumsi**, ditandai jelas, dan perlu diganti saat angka nyata ada.

## Model jual

Mengikuti pola ICC: **budget top-up 100% jadi budget views untuk clipper, biaya platform ditambahkan di
atasnya**. Brand atau kreator tahu persis berapa yang sampai ke clipper.

| Komponen | Nilai |
|---|---|
| Biaya platform | **15%** dari budget, dibayar di atas budget |
| Minimal top-up budget | **Rp3.000.000** per kampanye |
| Rate per 1.000 views | Ditentukan pembuat kampanye |
| Batas bayar per klip | Ditentukan pembuat kampanye |

Contoh: budget Rp10.000.000 + biaya 15% Rp1.500.000 = total bayar Rp11.500.000. Seluruh Rp10.000.000
masuk escrow kampanye.

## HPP per kampanye

### Biaya transaksi (dari Xendit)

| Pos | Tarif Xendit | Dipakai di hitungan |
|---|---|---|
| Terima pembayaran lewat Virtual Account | Rp9.000 + Rp4.000 per transaksi | Rp13.000, ditambah PPN 11% = **Rp14.430** per top-up |
| Terima pembayaran lewat QRIS | 0,70% + Rp4.000 | Tidak dipakai untuk top-up besar, karena Rp10 jt jadi Rp74.000 |
| Payout ke bank atau e-wallet | 1,00% (minimal Rp2.500) + Rp4.000 per transfer | dihitung per clipper, ditambah PPN 11% |

PPN 11% atas biaya layanan Xendit adalah asumsi. Cek faktur Xendit pertama untuk angka pastinya.

### Biaya operasional (asumsi)

| Pos | Asumsi | Per kampanye |
|---|---|---|
| Infrastruktur (Supabase, R2, server API, pelacakan views) | Rp1.500.000 per bulan, 20 kampanye per bulan | Rp75.000 |
| Moderasi, sengketa, dan dukungan | 2 jam kerja x Rp50.000 per jam | Rp100.000 |
| Jumlah clipper yang dibayar | 4 clipper per Rp1.000.000 budget | lihat tabel |
| Cara payout | Digabung per clipper per kampanye, bukan per klip | lihat catatan |

### Hasil

Rumus: HPP = Rp14.430 (terima bayar) + jumlah clipper x biaya payout + Rp75.000 + Rp100.000.
Biaya payout per clipper = (maks(1% x bayaran clipper, Rp2.500) + Rp4.000) x 1,11.

| Budget | Clipper | Bayaran rata-rata | Payout total | HPP | Pendapatan 15% | Margin kotor |
|---|---|---|---|---|---|---|
| Rp3.000.000 | 12 | Rp250.000 | Rp86.580 | Rp276.010 | Rp450.000 | Rp173.990 (39%) |
| Rp5.000.000 | 20 | Rp250.000 | Rp144.300 | Rp333.730 | Rp750.000 | Rp416.270 (56%) |
| Rp10.000.000 | 40 | Rp250.000 | Rp288.600 | Rp478.030 | Rp1.500.000 | Rp1.021.970 (68%) |
| Rp25.000.000 | 100 | Rp250.000 | Rp721.500 | Rp910.930 | Rp3.750.000 | Rp2.839.070 (76%) |

Titik impas ada di sekitar budget Rp1,6 jt. Minimal top-up Rp3 jt memberi ruang untuk kampanye yang
clippernya lebih banyak dari asumsi.

### Catatan risiko

- **Payout per klip memakan margin.** Kalau tiap klip dibayar terpisah (klip Rp50.000 kena Rp7.215),
  kampanye Rp10 jt dengan 200 klip menghabiskan Rp1,44 jt hanya untuk biaya transfer, hampir seluruh
  biaya platform. Payout sebaiknya digabung per clipper per kampanye. Backend saat ini masih membayar
  per submission, jadi ini perlu diubah sebelum gerak uang nyata diaktifkan.
- **Pajak penghasilan platform** (misalnya PPh final UMKM 0,5% dari omzet) tidak dimasukkan ke HPP.
- **Kredit AI jalur instan** (Rp5.000 per kredit, biaya top-up 10%) tidak dihitung ulang di sini, karena
  biaya analisis dan render otomatis belum diketahui selama fiturnya belum jalan.
