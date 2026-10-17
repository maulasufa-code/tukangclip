# Referensi terukur: cerebrium.ai

Nilai ini diukur dari halaman live (`https://cerebrium.ai/`, viewport 1024px) lewat computed style.
Ini angka referensi, bukan kode dan bukan aset. Font dan gambar mereka tidak dipakai.

## Tipografi

| Peran | Font | Ukuran | Bobot | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| H1 hero | ABC Favorit (berlisensi) | 69.8px | 300 | 69.8px (1.0) | -1.75px (sekitar -0.025em) |
| Body | Suisse Int'l (berlisensi) | 16px | 500 | 24px (1.5) | normal |
| Paragraf hero | Suisse Int'l | 17px | 400 | 22.95px (1.35) | 0.17px |
| Label kecil (judul kartu) | Suisse Int'l Mono (berlisensi) | 13px | 400 | 13.9px (1.07) | -0.33px |

Catatan:
- Headline memakai bobot 300, bukan tebal. Karakternya datang dari ukuran besar dan tracking yang rapat.
- Font pengganti yang dicari harus punya bobot tipis (300) dan varian mono.

## Warna

| Peran | Nilai | Catatan |
|---|---|---|
| Latar terang | `#ffffff` | Section terang |
| Latar abu-biru muda | `#eef2f5` | Dipakai tombol sekunder dan kartu |
| Biru tinta | `#172b76` | Teks utama di section terang |
| Hero gelap | (belum diukur, pakai latar gelap) | Teks hero putih |
| Aksen merah muda | `#ff488b`, `#f6186a` | Aksen dan tekanan, dipakai cukup banyak |
| Abu-biru sekunder | `#cfd7e7`, `#dbe5ed`, `#586490` | Garis dan teks pendukung |

Catatan: palet cerebrium tidak satu tema gelap. Halamannya bergantian terang dan gelap per section.
Aksen merah muda muncul di beberapa tempat, bukan satu warna saja.

## Tombol dan kontrol

- Tombol sekunder: latar `#eef2f5`, teks `#172b76`, radius 7px, padding 0 20px, tinggi 44px.
- Tombol primer di hero: belum diukur, perlu cek terpisah.

## Spasi dan ritme

- Section memakai kelas `section-spacing` dengan padding horizontal 20px dan vertikal yang diatur kelas.
- Judul section (H2) punya margin bawah 50px.
- Ritme: section terang dan gelap bergantian, dengan kelas `dark` sebagai penanda.

## Gerak

- Ada loader awal (logo dengan dua bar animasi, 1 detik, ease-in-out, infinite) sebelum halaman terbuka.
- Transisi overlay keluar: 0.3s, `cubic-bezier(0.4, 0, 0.2, 1)`.
- Hampir semua elemen interaktif memakai `transition: all`. Durasi dan easing per elemen belum diukur satu per satu.
- Kemunculan section saat scroll belum terukur. Perlu cek dengan scroll pelan lalu membaca kelas yang berubah.

## Yang belum terukur

- Warna dan gaya hero gelap secara pasti.
- Durasi dan easing transisi scroll dan hover per komponen.
- Perilaku responsif di 375px.
