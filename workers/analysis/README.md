# Worker Analisis (transkrip ke edit plan)

Alur: klaim job via `claim_next_ai_job()` -> unduh dari R2 -> FFmpeg ke WAV
16kHz mono -> faster-whisper per kata (default `small` di CPU) -> LLM JSON ->
validasi `EditPlan` -> simpan `edit_plans` -> status `rendering`.

LLM tidak menyentuh video. Outputnya JSON 5-10 momen 30-60 detik,
tidak tumpang tindih, hook terisi, judul dan hashtag Indonesia.

## Jalan lokal

1. Isi env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, R2, `LLM_API_KEY`,
   opsional `LLM_BASE_URL`, `LLM_MODEL`, `WHISPER_MODEL`.
2. `pip install -r requirements.txt` plus `ffmpeg` di PATH.
3. `pytest tests -q`.
4. `python worker.py` (loop klaim tiap 10 detik bila kosong).
