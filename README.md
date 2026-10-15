# TukangClip

Fase 1: Next.js + Supabase (auth, profil, RLS, upload R2, tabel job).

## Struktur

- `apps/web`: Next.js App Router + TypeScript. Deploy di Vercel.
- `services/api`: FastAPI. Di Fase 1 hanya dokumen kontrak, implementasi di Fase 2.
- `workers/analysis`, `workers/render`: kerangka worker. Implementasi di Fase 2-3.
- `supabase/migrations`: SQL + RLS. Sumber kebenaran skema.
- `tests/e2e`: Playwright untuk alur kritis.
- `packages/shared`: tipe bersama (EditPlan, status job).

## Jalan lokal Fase 1

1. Buat project Supabase, jalankan `supabase/migrations/20261015_fase1_profiles_jobs.sql` di SQL editor.
2. Salin `.env.example` ke `apps/web/.env.local`, isi nilai Supabase dan R2.
3. `npm install`, lalu `npm run dev:web`.
4. Buka `/daftar`, buat akun, verifikasi email, lalu buka `/unggah`.

Video tidak lewat Vercel. Browser PUT langsung ke R2 memakai URL bertanda yang berumur pendek dari `POST /api/r2/presign`.
