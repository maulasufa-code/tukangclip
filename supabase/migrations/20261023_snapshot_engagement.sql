-- Like dan komentar ikut dicatat bersama views di setiap snapshot harian.
alter table public.view_snapshots
  add column if not exists likes bigint not null default 0,
  add column if not exists comments bigint not null default 0;
