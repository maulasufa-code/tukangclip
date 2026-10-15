-- Koneksi OAuth akun media sosial kreator. Token hanya via service role.
create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null,
  account_name text not null default '',
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform),
  constraint social_platform check (platform in ('youtube', 'tiktok', 'meta'))
);
create index if not exists social_accounts_user_idx on public.social_accounts (user_id);

drop trigger if exists trg_social_touch on public.social_accounts;
create trigger trg_social_touch before update on public.social_accounts
  for each row execute function public.touch_updated_at();

alter table public.social_accounts enable row level security;

drop policy if exists "social_read_own" on public.social_accounts;
create policy "social_read_own" on public.social_accounts
  for select to authenticated using (auth.uid() = user_id);
