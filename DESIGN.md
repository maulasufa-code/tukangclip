# DESIGN.md

Arah desain TukangClip. File ini sumber kebenaran untuk identitas, palet, tipografi, stack, dan dial.
`AGENTS.md` mengarahkan agen ke file ini untuk kerja UI. Angka referensi dari cerebrium.ai ada di
`docs/referensi-cerebrium.md`, dan hanya dipakai sebagai acuan craft, bukan untuk disalin.

## Sumber arah

Keputusan ini datang dari pemilik produk.

| Pertanyaan | Jawaban pemilik |
|---|---|
| Cakupan | Landing page dulu (`apps/web/app/page.tsx`) |
| Gaya | Mirip cerebrium.ai dari sisi craft: tipografi, gerak, interaksi, dan layout. Gambar dan kode mereka tidak disalin |
| Stack | HTML5 semantik, Tailwind, GSAP, Three.js dengan WebGPU, dan Playwright |
| Statistik dan bukti sosial | Tidak ada angka atau testimoni yang dikarang. Yang tampil hanya fakta produk nyata |
| Aset logo | Mark empat bar kuning dari logo, digambar ulang sebagai elemen CSS di header dan footer. File PNG tidak dipakai di landing |

Bagian yang dikarang agen, dan bisa dibantah: pemilihan font pengganti, palet turunan, dan pembagian section.

## Produk dan audiens

TukangClip memotong video panjang jadi klip vertikal. Ada dua sisi pengguna:

- **Kreator**: punya video panjang, ingin klip siap tayang, bisa lewat jalur otomatis atau jalur kampanye.
- **Editor**: mencari proyek, mengerjakan potongan, dibayar per 1.000 views.

Audiensnya orang Indonesia yang bekerja dengan video setiap hari, bukan pembeli enterprise.

## Stack

- **HTML5 semantik**: satu `h1`, `main`, `header`, `footer`, `section` dengan `aria-labelledby`, `nav` dengan
  `aria-label`, dan list untuk langkah, status, serta kartu.
- **Tailwind**: semua gaya lewat kelas utilitas. Token warna landing memakai prefiks `cl-` di `tailwind.config.ts`.
  Token `tinta`, `kertas`, dan `aksen` tetap dipakai halaman aplikasi.
- **GSAP** (`gsap` dengan `ScrollTrigger`): judul naik per kata, blok masuk dengan fade dan blur, dan log job
  muncul berurutan. Semua animasi dibuat di dalam efek React, jadi konten tetap terlihat tanpa JS.
- **Three.js dengan WebGPU**: `WebGPURenderer` dari `three/webgpu`. Saat WebGPU tidak tersedia, renderer
  otomatis memakai backend WebGL 2. Latar titik di atas section gelap digambar di kanvas 2D terpisah.
- **Playwright**: tes di `tests/e2e/specs/landing.spec.ts` memeriksa hero, anchor, semantik, dan tata letak mobile.

## Bahasa visual

- Headline besar dengan bobot tipis (300) dan tracking rapat.
- Section gelap dan terang bergantian, dengan panel terang yang menimpa section gelap di tepinya.
- Satu aksen merah muda (`#ff488b`), dipakai hemat di tombol utama, kata penekan judul, dan penanda.
- Latar 3D berupa riben dan bola kaca yang bergerak pelan. Kursor memengaruhi rotasinya.
- Gerak: judul naik per kata, blok masuk saat scroll, dan animasi hover. Semuanya berhenti saat
  `prefers-reduced-motion` aktif.

Yang sengaja tidak dipakai, karena tidak ada isinya di produk ini: logo "trusted by", angka uptime atau
kapasitas, klaim kepatuhan (SOC 2, ISO, HIPAA), testimoni, dan jurnal dengan artikel fiktif.

## Palet

| Token | Nilai | Peran |
|---|---|---|
| `cl-bg` | `#050208` | Latar gelap di belakang scene 3D |
| `cl-night` | `#101421` | Latar kotak log dan panel gelap |
| `cl-paper` | `#ffffff` | Panel terang |
| `cl-slate` | `#eef2f5` | Panel terang kedua dan latar tombol sekunder |
| `cl-ink` | `#172b76` | Teks utama di panel terang |
| `cl-ink-soft` | `#8e99c4` | Hanya untuk aksen kecil di atas gelap, bukan teks di atas terang |
| `cl-muted` | `#c9bdd6` | Teks pendukung di section gelap |
| `cl-accent` | `#ff488b` | Aksen tunggal |
| `cl-accent-hi` | `#ff6aa2` | Aksen saat tombol disorot |
| `cl-accent-ink` | `#1a0610` | Teks di atas tombol aksen |

Kontras yang dihitung (WCAG AA: 4.5:1 untuk teks normal, 3:1 untuk teks besar dan tepi kontrol):

| Pasangan | Rasio | Status |
|---|---|---|
| `#ffffff` di atas `#050208` | 20.62:1 | lulus |
| `#c9bdd6` di atas `#050208` | 11.52:1 | lulus |
| `#eadff2` di atas `#050208` | 16.04:1 | lulus |
| `#ff488b` di atas `#050208` | 6.43:1 | lulus, aman sebagai teks dan cincin fokus di atas gelap |
| `#1a0610` di atas `#ff488b` | 6.08:1 | lulus, ini teks tombol aksen |
| `#172b76` di atas `#ffffff` | 12.78:1 | lulus |
| `#3b4a86` di atas `#ffffff` | 8.37:1 | lulus |
| `#46538c` di atas `#ffffff` | 7.30:1 | lulus |
| `#5a6a94` di atas `#ffffff` | 5.35:1 | lulus, dipakai untuk langkah yang tidak aktif |
| `#172b76` di atas `#eef2f5` | 11.35:1 | lulus |

Konsekuensi: aksen merah muda tidak dipakai sebagai teks di atas putih. Di atas putih, teks memakai `cl-ink` atau
turunannya.

## Tipografi

- **Headline dan body**: Hanken Grotesk, bobot 300 untuk headline besar, 400 untuk body, 500 untuk judul kecil.
- **Label dan tombol**: DM Mono, dipakai untuk label kecil, tombol, dan tanda status. Huruf kapital dipakai
  hanya di label kecil.

Alasan: Hanken Grotesk adalah grotesk gratis yang dekat dengan karakter grotesk Swiss di cerebrium.ai. DM Mono
memberi label kecil yang tegas tanpa berlebihan. Keduanya dimuat lewat `next/font/google`.

Font asli cerebrium (Suisse, ABC Favorit) tidak dipakai karena berlisensi komersial.

## Dial

Dial: ENERGY 2 / RHYTHM 3 / MOTION 2

- **ENERGY 2**: hero besar dengan latar 3D, tetapi tidak ada layout eksperimental.
- **RHYTHM 3**: section gelap, terang, dan panel yang menimpa section gelap. Komposisi tiap section berbeda.
- **MOTION 2**: gerak masuk, scroll, dan hover. Tidak ada gerak tanpa henti selain latar 3D yang lambat.

## Peta halaman

Urutan section mengikuti alur produk.

| Section | Latar | Isi | Alasan ada |
|---|---|---|---|
| Hero | gelap, dengan scene 3D | Janji utama dan dua tombol nyata | Pengunjung perlu tahu ini apa dan bisa langsung masuk |
| Fakta berjalan | gelap | Batas teknis yang benar: 2 GB, 30 menit, 1 kredit | Fakta nyata, bukan statistik |
| Cara kerja | terang (panel) | Empat langkah di kiri, dan empat ilustrasi di kanan | Menjelaskan alur dari unggah sampai render |
| Keamanan | gelap | Verifikasi dua langkah, rekening terenkripsi, RLS, escrow | Menjawab kekhawatiran uang dan data tanpa klaim palsu |
| Peran | gelap | Tab Kreator, Editor, dan Studio dengan kartu fitur nyata | Produk ini dua sisi |
| Status rilis | terang (panel) | Yang sudah jalan dan yang menyusul | Mencatat apa yang sudah jalan dan apa yang belum |
| Ajakan | gelap | Buat akun dan masuk | Satu tempat masuk yang jelas |

## Batas kejujuran

Ini yang belum jalan dan karenanya tidak boleh diklaim di landing:

- Gerak uang nyata lewat Xendit belum aktif (masih dicatat sebagai escrow).
- OAuth TikTok masih menunggu verifikasi dari TikTok.
- Analisis dan render otomatis masih dalam pengerjaan.
- API backend Fase 2 belum tersambung di halaman tertentu.

Statusnya ditampilkan apa adanya di landing, bukan dibungkam. Grafik dan peta momen di landing diberi label
ilustrasi.

## Yang harus ditolak saat review

- Angka atau testimoni yang tidak bisa dibuktikan.
- Screenshot palsu. Kalau produk belum bisa difoto, jangan digambar.
- Klaim fitur yang belum jalan, atau platform yang belum didukung.
- Section yang menambah tinggi halaman tanpa menambah informasi.
- Teks kecil di atas putih yang tidak lulus kontras.
