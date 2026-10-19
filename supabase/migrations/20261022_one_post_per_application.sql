-- Satu klip = satu set tautan, satu tautan per platform. Satu lamaran boleh banyak klip.
-- Daftar tautan disimpan di posted_links; posted_url tetap berisi tautan pertama.
alter table public.submissions
  add column if not exists posted_links jsonb not null default '[]'::jsonb;

-- Data lama: satu tautan dari kolom posted_url dipindah ke posted_links.
update public.submissions
  set posted_links = jsonb_build_array(jsonb_build_object('platform', posted_platform, 'url', posted_url))
  where posted_url is not null and posted_links = '[]'::jsonb;

-- Tautan yang sama tidak boleh dipakai dua kali; dicek di API (marketplace.py) lewat posted_links.
drop index if exists public.submissions_one_per_application;
