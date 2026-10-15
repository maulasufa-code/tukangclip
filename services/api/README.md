# Kontrak API (diimplementasi penuh di Fase 2)

FastAPI menjadi satu-satunya penulis logika uang dan pemegang service role.

Kontrak Fase 1 yang dipakai web:

- `POST /api/r2/presign` (sementara di Next.js, pindah ke FastAPI di Fase 2):
  input `{filename, bytes, mime}`, output `{uploadUrl, r2Key, idempotencyKey}`.
- `ai_jobs` ditulis klien hanya saat insert milik sendiri (RLS).
  Status diubah worker via `claim_next_ai_job()` memakai service role.

Aturan: tidak ada kalkulasi saldo di klien. Semua transisi status dan
ledger dikerjakan di `services/api` mulai Fase 2.
