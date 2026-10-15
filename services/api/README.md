# TukangClip API (FastAPI)

Satu-satunya penulis logika server. Web tidak menghitung saldo atau status.

## Endpoint Fase 2

- `GET /health` tanpa auth.
- `POST /r2/presign` butuh `Authorization: Bearer <supabase-jwt>`. Ganti rute Next.js setelah ini live.
- `POST /jobs` buat baris `ai_jobs` milik pemanggil via service role.
- `GET /jobs/{id}` baca milik sendiri.

## Jalan lokal

1. Salin `.env.example` ke `.env`, isi Supabase service role dan R2.
2. `pip install -r requirements.txt`.
3. `uvicorn app.main:app --reload --port 8000`.
4. `pytest tests -q`.
