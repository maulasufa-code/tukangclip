# Deploy TukangClip

## Vercel (web dan API)

`vercel.json` hanya berisi dua service: `web` (publik di `/`) dan `api`
(publik di `/api/*`). Worker analysis, render, dan tracker TIDAK ikut ke
Vercel karena loop tanpa henti dan job belasan menit, melebihi batas
serverless. Mereka jalan di VPS via `docker-compose.yml`.

Env di Vercel:
- Service `web`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  dan `NEXT_PUBLIC_API_URL=https://domain-anda/api`.
- Service `api`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_ANON_KEY`, R2, `API_PREFIX=/api`, Xendit, `PAYOUT_ENC_KEY`,
  Google OAuth bila distribusi aktif.

## VPS worker

1. Salin `services/api/.env` yang sudah terisi ke server.
2. `docker compose up -d --build`.
3. GPU disewa per jam hanya bila whisper small kurang akurat.

## Tidak ada binding antar service

Web memanggil API dari browser memakai URL publik, bukan binding internal.
Binding Vercel hanya injeksi URL internal antar fungsi server dan tidak
berlaku untuk fetch dari browser, jadi tidak dipakai di sini.
