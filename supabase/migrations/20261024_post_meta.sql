-- Judul dan tanggal unggah tiap tautan, diambil dari platform oleh tracker.
-- Bentuk: {"youtube": {"title": "...", "published_at": "..."}}
alter table public.submissions
  add column if not exists posted_meta jsonb not null default '{}'::jsonb;
