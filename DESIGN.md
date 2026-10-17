# DESIGN.md

Arah desain TukangClip. File ini sumber kebenaran untuk identitas, palet, tipografi, dan dial.
`AGENTS.md` mengarahkan agen ke file ini untuk kerja UI, lalu ke `antislop` sebagai filter.

## Sumber arah

Keputusan ini datang dari pemilik produk, bukan dikarang agen. Ringkasannya:

| Pertanyaan | Jawaban pemilik |
|---|---|
| Cakupan | Landing page dulu (`apps/web/app/page.tsx`) |
| Tema dasar | Dark default |
| Kemiripan dengan cerebrium.ai | Craft visual saja, section khas cerebrium dibuang |
| Statistik dan bukti sosial | Dikosongkan sampai datanya nyata |
| Aset logo | `tukangclip_logo.png` (dipakai, bukan digambar ulang) |

Catatan kejujuran: bidang tipografi, palet turunan, dan motif diturunkan agen dari lima keputusan di atas,
lalu ditulis di sini supaya bisa dibantah dengan nomor baris. Itu bagian yang paling wajar kamu ganti.

## Produk dan audiens

TukangClip memotong video panjang jadi klip vertikal. Ada dua sisi pengguna:

- **Kreator**: punya video panjang, ingin klip siap tayang, bisa lewat jalur otomatis atau jalur kampanye.
- **Editor**: mencari proyek, mengerjakan potongan, dibayar per 1.000 views.

Audiensnya orang Indonesia yang bekerja dengan video setiap hari, bukan pembeli enterprise.

## Bahasa visual

Yang diambil dari cerebrium.ai: kontras tegas, skala tipografi berani, ritme antar-section yang tidak seragam,
disiplin aksen (satu warna, dipakai hemat), latar gelap yang tenang.

Yang dibuang, karena tidak ada isinya di produk ini:

| Elemen cerebrium | Alasan dibuang |
|---|---|
| Baris logo "trusted by" | R-05 melarangnya di bawah hero, dan TukangClip belum punya pelanggan (R-18, R-38) |
| Jendela terminal palsu | R-05 melarangnya sebagai visual hero, dan TukangClip tidak punya CLI (R-38) |
| Counter "99.999% uptime", "2500+ GPU" | R-17 dan R-36 melarang angka tanpa sumber nyata |
| Bento grid | R-05 melarang bento sebagai layout default |
| Klaim SOC 2, ISO, HIPAA | R-36 melarang klaim kepatuhan tanpa bukti |
| Navbar dengan blur | R-10 membatasi glassmorphism, dan header solid menjaga kontras teks tetap pasti (R-25) |

Gradient glow juga tidak dipakai. Header dan panel memakai bidang solid, bukan cahaya.

## Identitas

- **Mark**: `tukangclip_logo.png`. Trapesium membulat dengan dua bar vertikal di dalamnya, terbaca sebagai layar
  plus tanda play/pause. Satu warna stroke, `#FCC401`.
- **Wordmark**: teks "TukangClip" di samping mark. Logo tidak membawa wordmark sendiri.
- **Motif**: dua bar dari mark dipakai ulang di dua tingkat. Versi kuning menandai judul langkah dan judul peran,
  versi redup (`garis-terang`) menandai butir daftar. Alasannya: satu gestur yang khas produk, bukan hiasan acak,
  dan langsung terbaca sebagai "klip". Aksen kuning tetap disimpan untuk tombol dan penanda judul.
- **Angka**: kolom angka memakai tabular numerals supaya durasi dan kredit tidak goyang saat nilainya berubah.

## Palet

Dua warna inti plus satu aksen. Netral tidak dihitung.

| Token | Nilai | Peran |
|---|---|---|
| `arang` | `#0c0a09` | Latar halaman, hitam hangat |
| `permukaan` | `#1a1513` | Bidang naik di atas latar, pengganti bayangan |
| `garis` | `#332c26` | Garis rambut pemisah, dekoratif |
| `garis-terang` | `#6b6157` | Tepi kontrol yang berfungsi (tombol bergaris) |
| `teks` | `#f4f1ee` | Teks utama, putih hangat |
| `teks-lembut` | `#b3aaa2` | Teks pendukung |
| `kuning` | `#fcc401` | Aksen, sama dengan warna logo |
| `kuning-tekan` | `#ffd83d` | Aksen saat tombol ditekan atau disorot |
| `kuning-tinta` | `#1a1408` | Teks di atas bidang kuning |

Token terang (`kertas` `#fafaf9`, `tinta` `#1c1917`, `aksen` `#b45309`) tetap ada dan tetap dipakai halaman aplikasi.

Kontras terukur dengan `contrast-check.py` dari skill `antislop-human` (WCAG AA butuh 4.5:1 untuk teks normal, 3:1 untuk teks besar dan tepi kontrol):

| Pasangan | Rasio | Status |
|---|---|---|
| `teks` di atas `arang` | 17.56:1 | lulus |
| `teks` di atas `permukaan` | 16.08:1 | lulus |
| `teks-lembut` di atas `arang` | 8.64:1 | lulus |
| `teks-lembut` di atas `permukaan` | 7.92:1 | lulus |
| `kuning` di atas `arang` | 12.26:1 | lulus, aman sebagai teks dan cincin fokus |
| `kuning-tinta` di atas `kuning` | 11.36:1 | lulus, ini warna teks di tombol kuning |
| `garis-terang` di atas `arang` | 3.27:1 | lulus untuk tepi kontrol (non-teks) |
| `aksen` di atas `kertas` | 4.81:1 | lulus, dan halaman aplikasi tidak berubah |

Konsekuensi yang harus dipegang: kuning hanya boleh jadi teks atau bidang di atas gelap. Di atas putih, `#FCC401`
hanya 1.6:1, jadi ia tidak boleh jadi warna teks di halaman terang. Untuk itu pakai `aksen` `#b45309`.

## Tipografi

Satu keluarga: **Archivo**, bobot 400 sampai 800.

- Alasan pemilihan: Archivo adalah grotesque yang digambar untuk keterbacaan di ukuran kecil sekaligus punya
  kehadiran kuat di ukuran display, jadi satu keluarga bisa memikul headline besar dan teks UI yang padat.
  Skeletnya kaku dan pekerja, cocok dengan nada "tukang".
- Alasan bukan yang lain: Inter, Geist, dan Space Grotesk adalah pilihan default model, bukan pilihan yang datang
  dari karakter produk (R-06).
- Tanpa font mono. Alasan: satu-satunya kebutuhan angka sudah dijawab tabular numerals, dan mono di sini hanya akan
  jadi estetika terminal (R-06).

## Dial

Dial: ENERGY 2 / RHYTHM 3 / MOTION 2

- **ENERGY 2**: hero dikomandoi tipografi besar dan bidang gelap, tetapi tetap terkendali. Bukan 3 karena tidak ada
  layout eksperimental di sini.
- **RHYTHM 3**: tiap section punya komposisi berbeda, jadi halaman tidak terbaca sebagai tumpukan kartu seragam.
- **MOTION 2**: transisi hover, kemunculan section saat masuk viewport, dan lompatan anchor yang mulus.
  Semuanya berhenti saat `prefers-reduced-motion` aktif.

## Peta halaman

Urutan section mengikuti alur produk, bukan urutan template (R-05, C-3).

| Section | Isi | Alasan ada |
|---|---|---|
| Hero | Janji utama, dua tombol nyata, batas teknis yang benar | Pengunjung perlu tahu ini apa dan bisa langsung masuk |
| Dua jalur | Otomatis lawan kampanye | Ini percabangan pertama yang harus dipahami pengguna baru |
| Cara kerja | Empat langkah dengan batas nyata (2 GB, 30 menit, 1 kredit, 72 jam) | Menggantikan counter statistik palsu dengan fakta produk |
| Studio | Momen, efek per beat, judul YouTube dan TikTok, versi plan | Menunjukkan bahwa hasilnya bisa disunting, bukan kotak hitam |
| Kreator dan editor | Dua peran, escrow terkunci, bayaran per 1.000 views | Produk ini dua sisi, satu sisi saja tidak jujur |
| Akun sosial | Views terbaca dari akun tersambung, status TikTok apa adanya | Menjelaskan dari mana angka views datang |
| Keamanan | Verifikasi dua langkah, rekening payout terenkripsi, RLS | Menjawab kekhawatiran uang dan data tanpa klaim palsu |
| Penutup | Ajakan daftar dan masuk | Satu tempat masuk yang jelas |

## Batas kejujuran

Ini yang belum jalan dan karenanya tidak boleh diklaim di landing:

- Gerak uang nyata lewat Xendit belum aktif (masih dicatat sebagai escrow).
- OAuth TikTok masih menunggu verifikasi dari TikTok.
- API backend Fase 2 belum tersambung di halaman tertentu.

Statusnya ditampilkan apa adanya di landing, bukan dibungkam.

Komposisi tiap section sengaja dibuat berbeda supaya klaim RHYTHM 3 bisa dibuktikan (R-05).

| Section | Komposisi |
|---|---|
| Hero | Tipografi penuh lebar tanpa gambar, ditutup pita fakta tiga kolom |
| Dua jalur | Dua panel bersebelahan dengan lebar tidak sama (7 dan 5 dari 12), satu berlatar bidang naik |
| Cara kerja | Empat langkah sebaris dengan garis sambung di atasnya, lalu satu catatan status |
| Studio | Diagram di kiri (7) berdampingan dengan daftar istilah di kanan (5) |
| Kreator dan editor | Dua kolom setara yang dipisah garis vertikal, tanpa kotak |
| Uang dan data | Bertumpuk: tiga kolom bergaris di atas, pita lebar di bawahnya |
| Status rilis | Daftar dua kolom yang rapat |
| Penutup | Judul besar dengan dua tombol, ruang paling lega di halaman |

Yang dihindari: belah kiri-kanan dengan pola sama di tiga section berturut-turut. Itu alasan section Uang dan data dibuat bertumpuk.

Spasi vertikal dipakai sebagai penanda berat section, bukan nilai seragam: section biasa `py-12 sm:py-20`, Studio dan Penutup naik ke `py-14 sm:py-24` dan `py-16 sm:py-28` karena keduanya jeda baca, dan Status rilis tetap rapat di `py-14` karena ia catatan kaki, bukan section.

Bagian ini juga mencatat dua hal yang mudah salah: aksen kuning dipakai di tombol dan penanda judul saja, tidak di setiap butir daftar, dan diagram edit plan diberi label tiap momen supaya tidak terbaca sebagai skeleton loading (R-05, Part 1).

## Yang harus ditolak saat review

- Angka atau testimoni yang tidak bisa dibuktikan.
- Screenshot palsu. Kalau produk belum bisa difoto, jangan digambar.
- Section yang menambah tinggi halaman tanpa menambah informasi.
