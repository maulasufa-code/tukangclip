-- Niat top-up kredit AI. Dibayar via Xendit, dikredit via webhook.
create table if not exists public.topup_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount bigint not null,
  fee bigint not null default 0,
  credits int not null,
  currency text not null default 'IDR',
  status text not null default 'pending',
  xendit_id text unique,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topup_pos check (amount > 0 and credits > 0),
  constraint topup_status check (status in ('pending', 'paid', 'expired', 'failed'))
);
create index if not exists topup_intents_user_idx on public.topup_intents (user_id, created_at desc);

insert into public.settings (key, value) values
  ('credit_price_idr', '{"value": 5000}'),
  ('min_topup_idr', '{"value": 10000}')
on conflict (key) do nothing;

drop trigger if exists trg_topup_touch on public.topup_intents;
create trigger trg_topup_touch before update on public.topup_intents
  for each row execute function public.touch_updated_at();

alter table public.topup_intents enable row level security;

-- Pemilik hanya baca. Tulis via backend service role.
drop policy if exists "topup_read_own" on public.topup_intents;
create policy "topup_read_own" on public.topup_intents
  for select to authenticated using (auth.uid() = user_id);
