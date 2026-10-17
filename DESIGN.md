# DESIGN.md

Arah desain TukangClip. File ini sumber kebenaran untuk identitas, palet, tipografi, dan dial.
`AGENTS.md` mengarahkan agen ke file ini untuk kerja UI, lalu ke `antislop` sebagai filter.
Angka referensi dari cerebrium.ai ada di `docs/referensi-cerebrium.md`.

## Sumber arah

Keputusan ini datang dari pemilik produk. Arah sebelumnya (gelap penuh, Archivo) diganti atas permintaan pemilik
supaya tampilan mendekati cerebrium.ai dari sisi craft: tipografi, ritme, gerak, dan interaksi.

| Pertanyaan | Jawaban pemilik |
|---|---|
| Cakupan | Landing page dulu (`apps/web/app/page.tsx`) |
| Kemiripan dengan cerebrium.ai | Mirip dari sisi craft, termasuk font dan gerak. Gambar dan kode mereka tidak disalin |
| Statistik dan bukti sosial | Dikosongkan sampai datanya nyata |
| Aset logo | `tukangclip_logo.png` (dipakai, bukan digambar ulang) |

Catatan kejujuran: palet, pasangan font, dan dial di bawah diturunkan agen dari angka yang diukur di
`docs/referensi-cerebrium.md`, lalu ditulis di sini supaya bisa dibantah baris per baris.

## Produk dan audiens

TukangClip memotong video panjang jadi klip vertikal. Ada dua sisi pengguna:

- **Kreator**: punya video panjang, ingin klip siap tayang, bisa lewat jalur otomatis atau jalur kampanye.
- **Editor**: mencari proyek, mengerjakan potongan, dibayar per 1.000 views.

Audiensnya orang Indonesia yang bekerja dengan video setiap hari, bukan pembeli enterprise.

## Bahasa visual

Yang diambil dari cerebrium.ai (diukur, bukan ditebak):

- Headline besar dengan bobot tipis dan tracking rapat, bukan bobot tebal.
- Section terang dan gelap bergantian, supaya halaman punya ritme dan tidak terbaca sebagai satu warna.
- Satu aksen hangat yang dipakai hemat pada tombol utama dan penanda.
- Tombol sekunder berlatar abu-biru muda, radius 7px, tinggi 44px.
- Gerak yang halus: headline hero masuk sekali saat halaman dibuka (700ms), kemunculan section saat masuk layar (600ms),
  dan transisi hover 200ms. Loader awal tidak dibuat karena menambah kedipan tanpa isi.

Yang dibuang, karena tidak ada isinya di produk ini:

| Elemen cerebrium | Alasan dibuang |
|---|---|
| Baris logo "trusted by" | R-05 melarangnya di bawah hero, dan TukangClip belum punya pelanggan (R-18, R-38) |
| Jendela terminal palsu | R-05 melarangnya sebagai visual hero, dan TukangClip tidak punya CLI (R-38) |
| Counter "99.999% uptime", "2500+ GPU" | R-17 dan R-36 melarang angka tanpa sumber nyata |
| Bento grid | R-05 melarang bento sebagai layout default |
| Klaim SOC 2, ISO, HIPAA | R-36 melarang klaim kepatuhan tanpa bukti |
| Aksen merah muda | Tidak dipakai. Aksen TukangClip diambil dari logo sendiri (kuning) |

## Identitas

- **Mark**: `tukangclip_logo.png`. Trapesium membulat dengan dua bar vertikal, terbaca sebagai layar plus tanda
  play/pause. Satu warna stroke, `#FCC401`.
- **Wordmark**: teks "TukangClip" di samping mark.
- **Motif**: dua bar dari mark dipakai ulang sebagai penanda judul langkah dan judul peran, dan sebagai butir daftar
  dengan warna redup. Satu gestur yang khas produk, bukan hiasan acak.
- **Angka**: kolom angka memakai tabular numerals supaya durasi dan kredit tidak goyang saat nilainya berubah.

## Palet

Dua warna inti plus satu aksen. Netral tidak dihitung.

| Token | Nilai | Peran |
|---|---|---|
| `kertas` | `#ffffff` | Latar section terang |
| `kabut` | `#eef2f5` | Bidang naik di section terang, latar tombol sekunder |
| `tinta` | `#1b2540` | Teks utama di section terang, biru tinta yang dekat dengan cerebrium |
| `tinta-lembut` | `#4a5878` | Teks pendukung di section terang |
| `malam` | `#0f1b3d` | Latar section gelap |
| `malam-lembut` | `#b8c3dc` | Teks pendukung di section gelap |
| `kuning` | `#fcc401` | Aksen, sama dengan warna logo |
| `kuning-tekan` | `#ffd83d` | Aksen saat tombol ditekan atau disorot |
| `kuning-tinta` | `#1a1408` | Teks di atas bidang kuning |
| `garis` | `#d5dce8` | Garis pemisah di section terang |

Kontras yang dihitung (WCAG AA: 4.5:1 untuk teks normal, 3:1 untuk teks besar dan tepi kontrol):

| Pasangan | Rasio | Status |
|---|---|---|
| `tinta` di atas `kertas` | 15.16:1 | lulus |
| `tinta-lembut` di atas `kertas` | 7.10:1 | lulus |
| `tinta-lembut` di atas `kabut` | 6.31:1 | lulus |
| `tinta` di atas `kabut` | 13.47:1 | lulus |
| `kertas` di atas `malam` | 16.87:1 | lulus |
| `malam-lembut` di atas `malam` | 9.54:1 | lulus |
| `kuning` di atas `malam` | 10.47:1 | lulus, aman sebagai teks dan cincin fokus |
| `kuning-tinta` di atas `kuning` | 11.36:1 | lulus, ini warna teks tombol kuning |
| `tinta` di atas `kuning` | 9.41:1 | lulus |

Konsekuensi: kuning tidak boleh jadi teks di atas `kertas` (rasionya rendah). Kuning hanya jadi bidang tombol
dengan teks `kuning-tinta`, atau teks dan cincin fokus di atas `malam`.

## Tipografi

Tiga keluarga, semuanya dari Google Fonts (berlisensi terbuka):

- **Headline**: Inter Tight, bobot 300 untuk hero dan 400 sampai 500 untuk judul section. Tracking hero sekitar -0.025em.
- **Body dan UI**: Inter, bobot 400 dan 500.
- **Label kecil dan angka teknis**: JetBrains Mono, bobot 400. Dipakai untuk label kecil seperti nama kartu atau tanda status.
  Geist Mono tidak dipakai karena belum tersedia di `next/font/google` pada Next 14.2.

Alasan pemilihan: cerebrium memakai grotesk Swiss (Suisse Int'l) dan grotesk geometris dengan headline tipis (ABC Favorit).
Inter Tight dan Inter punya karakter grotesk yang dekat dengan dua font itu, dan keduanya gratis. Ini pengganti,
bukan font yang sama. Font asli tidak dipakai karena berlisensi komersial.

Catatan antislop (R-06): Inter dipakai karena karakternya cocok dengan rujukan, bukan karena default model.
Kalau pemilik ingin pengganti lain, cukup ganti baris ini.

## Dial

Dial: ENERGY 2 / RHYTHM 3 / MOTION 2

- **ENERGY 2**: hero besar dengan headline tipis, tapi tanpa efek spektakuler. Bukan 3 karena tidak ada layout eksperimental.
- **RHYTHM 3**: section terang dan gelap bergantian, dengan komposisi yang berbeda tiap section.
- **MOTION 2**: masuk hero sekali, kemunculan section saat masuk viewport, transisi hover, dan lompatan anchor yang halus.
  Semuanya berhenti saat `prefers-reduced-motion` aktif. Pengguna yang meminta gerak lebih banyak bisa naik ke MOTION 3 nanti.

## Peta halaman

Urutan section mengikuti alur produk, bukan urutan template (R-05, C-3). Setiap section ditandai terang atau gelap
untuk menjaga RHYTHM.

| Section | Latar | Isi | Alasan ada |
|---|---|---|---|
| Hero | gelap | Janji utama, dua tombol nyata, batas teknis yang benar | Pengunjung perlu tahu ini apa dan bisa langsung masuk |
| Dua jalur | terang | Otomatis lawan kampanye | Percabangan pertama yang harus dipahami pengguna baru |
| Cara kerja | kabut | Empat langkah dengan batas nyata (2 GB, 30 menit, 1 kredit, 72 jam) | Menggantikan counter statistik palsu dengan fakta produk |
| Studio | gelap | Momen, efek per beat, judul YouTube dan TikTok, versi plan | Menunjukkan bahwa hasilnya bisa disunting, bukan kotak hitam |
| Kreator dan editor | terang | Dua peran, escrow terkunci, bayaran per 1.000 views | Produk ini dua sisi, satu sisi saja tidak jujur |
| Uang dan data | kabut | Verifikasi dua langkah, rekening payout terenkripsi, RLS | Menjawab kekhawatiran uang dan data tanpa klaim palsu |
| Status rilis | terang | Daftar dua kolom yang rapat | Mencatat apa yang sudah jalan dan apa yang belum |
| Penutup | gelap | Ajakan daftar dan masuk | Satu tempat masuk yang jelas |

## Batas kejujuran

Ini yang belum jalan dan karenanya tidak boleh diklaim di landing:

- Gerak uang nyata lewat Xendit belum aktif (masih dicatat sebagai escrow).
- OAuth TikTok masih menunggu verifikasi dari TikTok.
- API backend Fase 2 belum tersambung di halaman tertentu.

Statusnya ditampilkan apa adanya di landing, bukan dibungkam.

## Yang harus ditolak saat review

- Angka atau testimoni yang tidak bisa dibuktikan.
- Screenshot palsu. Kalau produk belum bisa difoto, jangan digambar.
- Section yang menambah tinggi halaman tanpa menambah informasi.
- Kuning sebagai teks di atas putih.
