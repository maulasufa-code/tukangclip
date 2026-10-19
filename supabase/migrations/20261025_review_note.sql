-- Alasan dari kreator saat klip direvisi atau ditolak. Kosong kalau disetujui.
alter table public.submissions
  add column if not exists review_note text not null default '';
