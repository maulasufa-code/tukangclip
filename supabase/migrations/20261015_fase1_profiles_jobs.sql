-- Fase 1: profil + job antrean Postgres
-- Jalankan di Supabase SQL editor. Idempoten bila dijalankan ulang sebagian.

create extension if not exists "pgcrypto";

-- Peran pengguna. Admin diatur manual via dashboard, bukan dari klien.
do $$ begin
  create type user_role as enum ('creator', 'editor', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type ai_job_status as enum (
    'queued', 'transcribing', 'analyzing', 'rendering', 'done', 'failed'
  );
exception when duplicate_object then null;
end $$;

-- Profil publik. Tidak ada data sensitif di sini.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'creator',
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint display_name_len check (char_length(display_name) <= 60)
);

-- Data privat. Hanya pemilik dan admin yang boleh baca.
create table if not exists public.profile_private (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Antrean job AI MVP. Worker klaim via FOR UPDATE SKIP LOCKED (lihat fungsi di bawah).
create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  source_r2_key text not null,
  source_bytes bigint not null default 0,
  source_mime text not null default 'video/mp4',
  status ai_job_status not null default 'queued',
  idempotency_key text not null unique,
  attempts int not null default 0,
  lease_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_bytes_range check (source_bytes >= 0 and source_bytes <= 2147483648),
  constraint r2_key_len check (char_length(source_r2_key) between 1 and 512)
);
create index if not exists ai_jobs_owner_idx on public.ai_jobs (owner_id, created_at desc);
create index if not exists ai_jobs_status_idx on public.ai_jobs (status, created_at)
  where status in ('queued', 'transcribing', 'analyzing', 'rendering');

-- updated_at otomatis
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_profile_private_touch on public.profile_private;
create trigger trg_profile_private_touch before update on public.profile_private
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_ai_jobs_touch on public.ai_jobs;
create trigger trg_ai_jobs_touch before update on public.ai_jobs
  for each row execute function public.touch_updated_at();

-- Baris profil dibuat otomatis saat user mendaftar. Role default creator.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, display_name)
  values (new.id, 'creator', coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  insert into public.profile_private (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Klaim satu job untuk worker. Aman untuk banyak worker paralel.
create or replace function public.claim_next_ai_job(p_worker text default 'worker')
returns public.ai_jobs language plpgsql security definer set search_path = public as $$
declare
  v_job public.ai_jobs;
begin
  select * into v_job from public.ai_jobs
  where status = 'queued' and (lease_until is null or lease_until < now())
  order by created_at asc
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update public.ai_jobs
  set status = 'transcribing',
      attempts = v_job.attempts + 1,
      lease_until = now() + interval '15 minutes',
      last_error = null
  where id = v_job.id
  returning * into v_job;

  return v_job;
end $$;

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.ai_jobs enable row level security;

-- profiles: semua user login boleh baca (nama publik), ubah hanya milik sendiri.
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- profile_private: hanya pemilik. Admin baca via service role, bukan policy ini.
drop policy if exists "private_read_own" on public.profile_private;
create policy "private_read_own" on public.profile_private
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "private_update_own" on public.profile_private;
create policy "private_update_own" on public.profile_private
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "private_insert_own" on public.profile_private;
create policy "private_insert_own" on public.profile_private
  for insert to authenticated with check (auth.uid() = user_id);

-- ai_jobs: pemilik boleh buat dan baca miliknya. Update status hanya via service role (worker/backend).
drop policy if exists "jobs_read_own" on public.ai_jobs;
create policy "jobs_read_own" on public.ai_jobs
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists "jobs_insert_own" on public.ai_jobs;
create policy "jobs_insert_own" on public.ai_jobs
  for insert to authenticated with check (auth.uid() = owner_id);

-- Tidak ada policy update/delete untuk role authenticated.
-- Worker memakai service role key di server dan memanggil claim_next_ai_job.
