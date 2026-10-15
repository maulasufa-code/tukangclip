-- Arsitektur database penuh TukangClip (Jalur Instan + Organic)
-- Cara pakai: jalankan SETELAH 20261015_fase1_profiles_jobs.sql di Supabase SQL editor.
-- Idempoten: aman dijalankan ulang. Semua CREATE memakai IF NOT EXISTS / OR REPLACE.
-- Aturan: ai_credit_ledger tidak pernah disentuh editor. Semua uang via service role.

create extension if not exists "pgcrypto";

-- Tipe status. Masing-masing dibungkus DO agar tidak gagal bila sudah ada.
do $$ begin
  create type submission_status as enum (
    'draft', 'submitted', 'approved', 'rejected', 'posted', 'tracking', 'paid_out'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type campaign_status as enum ('draft', 'open', 'closed', 'done');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type escrow_status as enum ('pending', 'locked', 'released', 'refunded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type application_status as enum (
    'applied', 'accepted', 'rejected', 'expired', 'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payout_status as enum (
    'queued', 'processing', 'succeeded', 'failed'
  );
exception when duplicate_object then null;
end $$;

-- Kolom level untuk editor. Ditambah ke tabel Fase 1 bila belum ada.
alter table public.profiles
  add column if not exists level int not null default 1,
  add column if not exists total_views bigint not null default 0,
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count int not null default 0;

alter table public.ai_jobs
  add column if not exists cost_credits int not null default 1;

-- Peran pemanggil. Dipakai policy tanpa rekursi.
create or replace function public.my_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- Rekening payout. Nomor tersimpan terenkripsi di backend sebelum insert.
-- Kolom ini tidak pernah dibaca klien selain milik sendiri.
create table if not exists public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  account_ref text not null,
  account_name text not null,
  is_verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_len check (char_length(provider) between 2 and 40)
);
create index if not exists payout_accounts_user_idx on public.payout_accounts (user_id);

-- Dokumen KYC. File KTP di bucket privat, di sini hanya kunci R2 + status.
create table if not exists public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  doc_type text not null default 'KTP',
  file_r2_key text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint kyc_status check (status in ('pending', 'approved', 'rejected'))
);
create index if not exists kyc_documents_user_idx on public.kyc_documents (user_id);

-- Audit akses KYC. Ditulis backend setiap kali file dibuka.
create table if not exists public.kyc_access_log (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.kyc_documents (id) on delete cascade,
  accessor uuid,
  reason text not null default '',
  accessed_at timestamptz not null default now()
);
create index if not exists kyc_access_log_doc_idx on public.kyc_access_log (doc_id);

-- Ledger kredit AI. Terpisah total dari money_ledger. Editor tidak punya akses.
create table if not exists public.ai_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount int not null,
  balance_after int not null,
  reason text not null default '',
  ref_job_id uuid references public.ai_jobs (id) on delete set null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  constraint amount_nonzero check (amount <> 0)
);
create index if not exists ai_credit_ledger_user_idx
  on public.ai_credit_ledger (user_id, created_at desc);

-- Rencana edit JSON dari LLM. Satu job bisa punya beberapa versi.
create table if not exists public.edit_plans (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.ai_jobs (id) on delete cascade,
  version int not null default 1,
  plan jsonb not null,
  created_at timestamptz not null default now(),
  unique (job_id, version)
);
create index if not exists edit_plans_job_idx on public.edit_plans (job_id);

-- Kampanye organic. Budget dikunci di muka (escrow).
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  brief text not null default '',
  source_url text,
  source_r2_key text,
  budget_total bigint not null,
  budget_remaining bigint not null,
  rate_per_1000_views bigint not null,
  cap_per_clip bigint not null,
  deadline_at timestamptz,
  status campaign_status not null default 'draft',
  escrow escrow_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_pos check (budget_total > 0 and budget_remaining >= 0 and budget_remaining <= budget_total),
  constraint rate_pos check (rate_per_1000_views > 0 and cap_per_clip > 0),
  constraint title_len check (char_length(title) between 4 and 120)
);
create index if not exists campaigns_creator_idx on public.campaigns (creator_id, created_at desc);
create index if not exists campaigns_open_idx on public.campaigns (status) where status = 'open';

-- Lamaran editor ke kampanye. SLA 72 jam dihitung di backend dari accepted_at.
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  editor_id uuid not null references auth.users (id) on delete cascade,
  status application_status not null default 'applied',
  accepted_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, editor_id)
);
create index if not exists applications_editor_idx on public.applications (editor_id, status);
create index if not exists applications_campaign_idx on public.applications (campaign_id, status);

-- Submission klip editor. Alur: draft -> submitted -> approved -> posted -> tracking -> paid_out.
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  file_r2_key text,
  status submission_status not null default 'draft',
  posted_url text,
  posted_platform text,
  posted_at timestamptz,
  views_final bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posted_check check (
    (status in ('posted', 'tracking', 'paid_out') and posted_url is not null)
    or (status not in ('posted', 'tracking', 'paid_out'))
  )
);
create index if not exists submissions_app_idx on public.submissions (application_id);
create index if not exists submissions_status_idx on public.submissions (status);

-- Klip jadi. Tepat satu sumber: job AI atau submission organic.
create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.ai_jobs (id) on delete set null,
  submission_id uuid references public.submissions (id) on delete set null,
  r2_key text not null,
  thumb_r2_key text,
  title text not null default '',
  description text not null default '',
  hashtags text[] not null default '{}',
  platform text,
  created_at timestamptz not null default now(),
  constraint one_source check (
    (job_id is not null and submission_id is null)
    or (job_id is null and submission_id is not null)
  )
);
create index if not exists clips_job_idx on public.clips (job_id);
create index if not exists clips_submission_idx on public.clips (submission_id);

-- Snapshot views harian per submission per platform.
create table if not exists public.view_snapshots (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  platform text not null,
  views bigint not null default 0,
  snapshot_date date not null,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (submission_id, platform, snapshot_date)
);
create index if not exists view_snapshots_sub_idx
  on public.view_snapshots (submission_id, snapshot_date desc);

-- Ledger uang double-entry. Setiap transfer = 2 baris satu group_id (debit + kredit).
create table if not exists public.money_ledger (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  account text not null,
  user_id uuid references auth.users (id) on delete set null,
  campaign_id uuid references public.campaigns (id) on delete set null,
  submission_id uuid references public.submissions (id) on delete set null,
  debit bigint not null default 0,
  credit bigint not null default 0,
  currency text not null default 'IDR',
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  constraint one_side check (
    (debit > 0 and credit = 0) or (credit > 0 and debit = 0)
  )
);
create index if not exists money_ledger_group_idx on public.money_ledger (group_id);
create index if not exists money_ledger_user_idx on public.money_ledger (user_id, created_at desc);
create index if not exists money_ledger_campaign_idx on public.money_ledger (campaign_id);

-- Payout ke editor via Xendit.
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid not null references auth.users (id) on delete cascade,
  amount bigint not null,
  fee bigint not null default 0,
  xendit_id text unique,
  status payout_status not null default 'queued',
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payout_pos check (amount > 0 and fee >= 0 and fee <= amount)
);
create index if not exists payouts_editor_idx on public.payouts (editor_id, created_at desc);

-- Library efek meme. LLM hanya boleh pilih id yang ada di sini.
create table if not exists public.effects (
  id text primary key,
  kind text not null,
  label text not null,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint effect_kind check (kind in ('sfx', 'sticker', 'zoom', 'freeze'))
);

insert into public.effects (id, kind, label, config) values
  ('sfx_tawa_01', 'sfx', 'Tawa pendek', '{"duck_db": -6, "max_ms": 1500}'),
  ('zoom_punch_01', 'zoom', 'Punch-in cepat', '{"scale": 1.15, "ms": 400}'),
  ('freeze_01', 'freeze', 'Freeze punchline', '{"ms": 800}')
on conflict (id) do nothing;

-- Pengaturan platform. Fee dibaca backend saat top-up.
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('platform_fee_pct', '{"value": 10}'),
  ('max_active_projects', '{"value": 3}'),
  ('sla_hours', '{"value": 72}'),
  ('view_hold_days', '{"value": 7}'),
  ('max_upload_bytes', '{"value": 2147483648}')
on conflict (key) do nothing;

-- Trigger updated_at untuk tabel baru.
drop trigger if exists trg_payout_accounts_touch on public.payout_accounts;
create trigger trg_payout_accounts_touch before update on public.payout_accounts
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_campaigns_touch on public.campaigns;
create trigger trg_campaigns_touch before update on public.campaigns
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_submissions_touch on public.submissions;
create trigger trg_submissions_touch before update on public.submissions
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_payouts_touch on public.payouts;
create trigger trg_payouts_touch before update on public.payouts
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_settings_touch on public.settings;
create trigger trg_settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- Cegah user menaikkan role atau level sendiri. Admin via service role.
create or replace function public.prevent_self_escalation()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role or new.level is distinct from old.level then
    if auth.uid() = old.id and not public.is_admin() then
      raise exception 'role dan level hanya bisa diubah admin';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_no_self_escalate on public.profiles;
create trigger trg_profiles_no_self_escalate before update on public.profiles
  for each row execute function public.prevent_self_escalation();

-- Ganti rekening me-reset verifikasi. Notifikasi email dikirim backend.
create or replace function public.reset_payout_verification()
returns trigger language plpgsql as $$
begin
  if new.account_ref is distinct from old.account_ref
     or new.provider is distinct from old.provider then
    new.is_verified = false;
    new.verified_at = null;
  end if;
  return new;
end $$;

drop trigger if exists trg_payout_reset_verify on public.payout_accounts;
create trigger trg_payout_reset_verify before update on public.payout_accounts
  for each row execute function public.reset_payout_verification();

-- Batasi proyek aktif editor (applied + accepted) maksimal 3.
create or replace function public.check_active_projects()
returns trigger language plpgsql as $$
declare
  aktif int;
begin
  select count(*) into aktif from public.applications
  where editor_id = new.editor_id and status in ('applied', 'accepted');
  if aktif > 3 then
    raise exception 'maksimal 3 proyek aktif per editor';
  end if;
  return new;
end $$;

drop trigger if exists trg_applications_limit on public.applications;
create trigger trg_applications_limit before insert or update on public.applications
  for each row execute function public.check_active_projects();

-- RLS untuk semua tabel baru.
alter table public.payout_accounts enable row level security;
alter table public.kyc_documents enable row level security;
alter table public.kyc_access_log enable row level security;
alter table public.ai_credit_ledger enable row level security;
alter table public.edit_plans enable row level security;
alter table public.campaigns enable row level security;
alter table public.applications enable row level security;
alter table public.submissions enable row level security;
alter table public.clips enable row level security;
alter table public.view_snapshots enable row level security;
alter table public.money_ledger enable row level security;
alter table public.payouts enable row level security;
alter table public.effects enable row level security;
alter table public.settings enable row level security;

-- payout_accounts: milik sendiri saja.
drop policy if exists "payout_read_own" on public.payout_accounts;
create policy "payout_read_own" on public.payout_accounts
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "payout_write_own" on public.payout_accounts;
create policy "payout_write_own" on public.payout_accounts
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "payout_update_own" on public.payout_accounts;
create policy "payout_update_own" on public.payout_accounts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- kyc: pemilik boleh insert dan baca status miliknya. File dibuka via backend.
drop policy if exists "kyc_read_own" on public.kyc_documents;
create policy "kyc_read_own" on public.kyc_documents
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "kyc_insert_own" on public.kyc_documents;
create policy "kyc_insert_own" on public.kyc_documents
  for insert to authenticated with check (auth.uid() = user_id);

-- Tidak ada policy klien untuk kyc_access_log, ai_credit_ledger, money_ledger.
-- Dibaca via backend memakai service role:
-- kyc_access_log: insert tiap akses, ai_credit_ledger: select own via RPC/backend,
-- money_ledger: select own via backend.

-- edit_plans: pemilik job boleh baca.
drop policy if exists "plans_read_job_owner" on public.edit_plans;
create policy "plans_read_job_owner" on public.edit_plans
  for select to authenticated using (
    exists (select 1 from public.ai_jobs j where j.id = edit_plans.job_id and j.owner_id = auth.uid())
  );

-- campaigns: marketplace terbuka untuk baca, tulis hanya kreator pemilik.
drop policy if exists "campaigns_read_open" on public.campaigns;
create policy "campaigns_read_open" on public.campaigns
  for select to authenticated using (status = 'open' or creator_id = auth.uid());
drop policy if exists "campaigns_insert_creator" on public.campaigns;
create policy "campaigns_insert_creator" on public.campaigns
  for insert to authenticated with check (
    auth.uid() = creator_id and public.my_role() in ('creator', 'admin')
  );
drop policy if exists "campaigns_update_own" on public.campaigns;
create policy "campaigns_update_own" on public.campaigns
  for update to authenticated using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

-- applications: editor kelola miliknya, kreator baca pelamar kampanyenya.
drop policy if exists "apps_read_party" on public.applications;
create policy "apps_read_party" on public.applications
  for select to authenticated using (
    editor_id = auth.uid()
    or exists (select 1 from public.campaigns c where c.id = applications.campaign_id and c.creator_id = auth.uid())
  );
drop policy if exists "apps_apply_own" on public.applications;
create policy "apps_apply_own" on public.applications
  for insert to authenticated with check (
    editor_id = auth.uid() and public.my_role() in ('editor', 'admin')
  );

-- submissions: editor dan kreator kampanye boleh baca. Tulis diatur backend Fase 6.
drop policy if exists "subs_read_party" on public.submissions;
create policy "subs_read_party" on public.submissions
  for select to authenticated using (
    exists (
      select 1 from public.applications a
      join public.campaigns c on c.id = a.campaign_id
      where a.id = submissions.application_id
      and (a.editor_id = auth.uid() or c.creator_id = auth.uid())
    )
  );
drop policy if exists "subs_insert_editor" on public.submissions;
create policy "subs_insert_editor" on public.submissions
  for insert to authenticated with check (
    exists (
      select 1 from public.applications a
      where a.id = submissions.application_id and a.editor_id = auth.uid()
    )
  );

-- clips: pemilik job AI atau pihak kampanye boleh baca.
drop policy if exists "clips_read_party" on public.clips;
create policy "clips_read_party" on public.clips
  for select to authenticated using (
    exists (select 1 from public.ai_jobs j where j.id = clips.job_id and j.owner_id = auth.uid())
    or exists (
      select 1 from public.submissions s
      join public.applications a on a.id = s.application_id
      join public.campaigns c on c.id = a.campaign_id
      where s.id = clips.submission_id and (a.editor_id = auth.uid() or c.creator_id = auth.uid())
    )
  );

-- view_snapshots: pihak kampanye boleh baca. Tulis via backend.
drop policy if exists "views_read_party" on public.view_snapshots;
create policy "views_read_party" on public.view_snapshots
  for select to authenticated using (
    exists (
      select 1 from public.submissions s
      join public.applications a on a.id = s.application_id
      join public.campaigns c on c.id = a.campaign_id
      where s.id = view_snapshots.submission_id
      and (a.editor_id = auth.uid() or c.creator_id = auth.uid())
    )
  );

-- payouts: editor baca miliknya. Tulis via backend Xendit.
drop policy if exists "payouts_read_own" on public.payouts;
create policy "payouts_read_own" on public.payouts
  for select to authenticated using (auth.uid() = editor_id);

-- effects dan settings: baca semua user login. Tulis via service role.
drop policy if exists "effects_read_all" on public.effects;
create policy "effects_read_all" on public.effects
  for select to authenticated using (true);
drop policy if exists "settings_read_all" on public.settings;
create policy "settings_read_all" on public.settings
  for select to authenticated using (true);
