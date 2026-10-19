-- Pembayaran masuk pindah ke Midtrans. Kolom referensi gateway diganti nama
-- supaya tidak menyebut Xendit. Payout tetap di Xendit (lihat payouts).
alter table public.topup_intents rename column xendit_id to gateway_ref;

-- Faktur untuk setiap pembayaran yang sudah lunas. Satu niat, satu faktur.
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null unique references public.topup_intents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  number text not null unique,
  kind text not null,
  campaign_id uuid references public.campaigns (id) on delete set null,
  amount bigint not null,
  fee bigint not null default 0,
  credits int not null default 0,
  currency text not null default 'IDR',
  issued_at timestamptz not null default now(),
  constraint invoices_kind check (kind in ('topup', 'fund'))
);
create index if not exists invoices_user_idx on public.invoices (user_id, issued_at desc);

alter table public.invoices enable row level security;

-- Pemilik hanya baca faktur miliknya. Tulis via backend service role.
drop policy if exists "invoices_read_own" on public.invoices;
create policy "invoices_read_own" on public.invoices
  for select to authenticated using (auth.uid() = user_id);
