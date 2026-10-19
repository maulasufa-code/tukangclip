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
| Aset logo | Logo TukangClip (bingkai klip dengan dua garis) digambar ulang sebagai SVG: `public/logo-tukangclip.svg` (kuning `#fcc501`), komponen `components/logo.tsx` (warna ikut `currentColor`), dan `app/icon.svg` untuk favicon. PNG asli tetap di `public/marka-tukangclip.png` |
| Tema | Kuning dan oranye, mengikuti warna logo. Berlaku untuk landing dan halaman aplikasi |

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
- Satu aksen kuning logo (`#fcc501`), dipakai hemat di tombol utama, kata penekan judul, dan penanda. Oranye (`#ff8a1f`) hanya muncul di cahaya latar 3D, dan karat (`#7a3300`) menggantikan aksen untuk teks di atas panel kuning atau krem.
- Latar 3D berupa roll film gulung yang terpotong: muka potong spiral berputar pelan, ekor film bersprocket
  mengalir keluar dan berakhir di potongan diagonal, dan satu irisan roll melintas di depan. Alasan: film adalah
  bahan baku produk (video dipotong jadi klip). Kursor memengaruhi rotasinya, dan scroll menggeser roll
  (jauh) lebih lambat dari irisan (dekat) untuk parallax.
- Gerak: judul naik per kata, blok masuk saat scroll, dan animasi hover. Keputusan pemilik: landing tidak
  memeriksa `prefers-reduced-motion`, jadi semua gerak jalan di setiap mesin.

Yang sengaja tidak dipakai, karena tidak ada isinya di produk ini: logo "trusted by", angka uptime atau
kapasitas, klaim kepatuhan (SOC 2, ISO, HIPAA), testimoni, dan jurnal dengan artikel fiktif.

## Palet

Kuning dari logo, dipasangkan dengan hitam hangat. Panel "cara kerja" memakai kuning penuh, panel status memakai krem kuning.

| Token | Nilai | Peran |
|---|---|---|
| `cl-bg` | `#0d0803` | Latar gelap di belakang scene 3D |
| `cl-night` | `#1b1308` | Latar kotak log, panel gelap, dan header aplikasi |
| `cl-paper` | `#fffdf6` | Putih hangat |
| `cl-slate` | `#fff0b8` | Panel krem kuning dan latar kartu ilustrasi |
| `cl-sun` | `#fcc501` | Panel kuning "cara kerja", sama dengan warna logo |
| `cl-ink` | `#1f1400` | Teks utama di atas panel terang dan kuning |
| `cl-ink-soft` | `#7a5a00` | Penanda kecil yang belum aktif di atas krem |
| `cl-muted` | `#dccdae` | Teks pendukung di section gelap |
| `cl-accent` | `#fcc501` | Aksen tunggal: tombol utama, kata penekan, fokus |
| `cl-accent-hi` | `#ffd84a` | Aksen saat tombol disorot |
| `cl-accent-ink` | `#1f1400` | Teks di atas tombol aksen |
| `cl-orange` | `#ff8a1f` | Cahaya oranye di scene 3D |
| `cl-rust` | `#7a3300` | Kata penekan dan tanda centang di atas panel kuning atau krem |

Halaman aplikasi memakai `tinta` `#1f1400`, `kertas` `#fff9e6`, dan skala `stone` yang digeser ke kuning
(tombol utama memakai `cl-accent`).

Kontras yang dihitung (WCAG AA: 4.5:1 untuk teks normal, 3:1 untuk teks besar dan tepi kontrol):

| Pasangan | Rasio | Status |
|---|---|---|
| `#dccdae` di atas `#0d0803` | 12.71:1 | lulus |
| `#fcc501` di atas `#0d0803` | 12.46:1 | lulus, aman sebagai teks dan cincin fokus di atas gelap |
| `#ffffff` di atas `#1b1308` | 18.37:1 | lulus |
| `#1f1400` di atas `#fcc501` | 11.33:1 | lulus, ini teks tombol aksen dan teks panel kuning |
| `#7a3300` di atas `#fcc501` | 5.70:1 | lulus |
| `#7a3300` di atas `#fff0b8` | 8.00:1 | lulus |
| `#1f1400` di atas `#fff0b8` | 15.89:1 | lulus |
| `#4a3600` di atas `#fcc501` | 7.22:1 | lulus |
| `#5c4300` di atas `#fcc501` | 5.81:1 | lulus, dipakai untuk langkah yang tidak aktif |
| `#6b4f00` di atas `#fff0b8` | 6.71:1 | lulus |
| `#7a5a00` di atas `#fff0b8` | 5.60:1 | lulus |

Konsekuensi: kuning tidak dipakai sebagai teks atau garis di atas panel kuning dan krem. Di sana teks memakai
`cl-ink`, `cl-rust`, atau turunan cokelat tuanya.

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

Konsep, susunan, dan copy diadaptasi dari dua referensi milik pemain lain di pasar clipping Indonesia:
Indonesia Clipper Community (landing untuk brand dan clipper) dan TernakKlip (halaman jelajah kampanye).
Yang diambil adalah pola: alur lima langkah, skema bayar per views dengan biaya di atas budget, simulator
budget, ajakan untuk clipper, FAQ, dan daftar kampanye dengan rate per 1.000 views. Teks ditulis ulang, dan
angka mereka (jumlah anggota, total views, papan peringkat, hashtag) tidak dipakai karena TukangClip belum
punya data sendiri.

Istilah: pengguna yang memotong klip disebut **clipper** di seluruh UI. Di database perannya tetap `editor`.

| Section | Latar | Isi | Alasan ada |
|---|---|---|---|
| Hero | gelap, dengan scene 3D | Janji utama, tombol Buka kampanye dan Jadi clipper | Dua sisi pasar langsung punya pintu masuk |
| Fakta berjalan | gelap | Bayar per 1.000 views, budget 100% ke clipper, biaya 15%, klip disetujui sebelum tayang, tenggat 72 jam | Fakta produk nyata |
| Alur | kuning (panel) | Lima langkah kampanye di kiri, ilustrasi tiap langkah di kanan | Menjelaskan alur dari brief sampai bayaran |
| Harga | gelap | Skema biaya dan simulator budget | Harga yang bisa dihitung sendiri, dari docs/harga-kampanye.md |
| Kampanye berjalan | krem (panel) | Tiga kampanye terbaru dari API, atau keadaan kosong atau gagal | Bukti pasar yang nyata, tanpa angka karangan |
| Untuk clipper | gelap | Potong, posting, dibayar, plus aturan proyek dan keamanan rekening | Sisi clipper |
| FAQ dan status | krem (panel) | Enam pertanyaan dengan jawaban dari perilaku backend, dan status rilis | Menjawab keberatan, dan jujur soal yang belum jalan |
| Ajakan | gelap | Buka kampanye dan daftar jadi clipper | Satu tempat masuk yang jelas |

Halaman `/jelajah` menampilkan semua kampanye terbuka tanpa login, dengan urutan terbaru, sisa budget
terbesar, dan rate tertinggi. Melamar tetap perlu masuk sebagai clipper.

## Batas kejujuran

Ini yang belum jalan dan karenanya tidak boleh diklaim di landing:

- Pembayaran lewat Midtrans masih mode sandbox. Pencairan ke clipper (payout, Xendit) belum aktif, jadi bayaran masih dicatat sebagai escrow.
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
