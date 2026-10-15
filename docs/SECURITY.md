# Keamanan TukangClip

## DAST hanya staging

- Scan dinamis hanya via workflow `dast-staging.yml`, pemicu manual.
- Guard menolak target produksi (kata prod, domain utama, vercel.app).
- Tidak pernah scan produksi atau data pengguna asli.
- Langkah scan default memakai OWASP ZAP baseline. Ganti dengan perintah
  Strix di blok yang ditandai saat lisensi siap.

## 2FA editor

- Halaman `/keamanan` memasang TOTP via Supabase Auth MFA.
- Endpoint payout menolak editor tanpa faktor terverifikasi (`editor-wajib-2fa`).
- Ulangi verifikasi bila ganti perangkat.

## Rekening payout

- Nomor masuk via `POST /payout-accounts`, disimpan terenkripsi Fernet
  dengan `PAYOUT_ENC_KEY`. Tanpa kunci, tulis dan baca gagal tertutup.
- Ganti rekening me-reset `is_verified` lewat trigger DB.
- Rotasi kunci: dekripsi massal dengan kunci lama, enkripsi ulang dengan
  kunci baru, lalu cabut kunci lama. Enkripsi at-rest kolom via Vault atau
  pgsodium dicatat sebagai hardening lanjutan.

## Audit KYC

- Setiap buka berkas lewat `POST /kyc/{id}/access` menulis
  `kyc_access_log` dan memberi signed URL 5 menit.
- Akses langsung bucket privat tanpa log dilarang.

## Header web

- `X-Frame-Options DENY`, `nosniff`, referrer ketat, dan permission kamera,
  mikrofon, dan lokasi dimatikan di `next.config.mjs`.
