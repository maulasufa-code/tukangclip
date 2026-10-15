# DATABASE_MAP generated

Dibuat otomatis dari SQL. Jangan edit manual. Jalankan `npm run db:map`.

Migrasi terbaca: 20261015_fase1_profiles_jobs.sql, 20261016_full_platform.sql, 20261018_render_claim.sql

Tipe: user_role (20261015_fase1_profiles_jobs.sql), ai_job_status (20261015_fase1_profiles_jobs.sql), submission_status (20261016_full_platform.sql), campaign_status (20261016_full_platform.sql), escrow_status (20261016_full_platform.sql), application_status (20261016_full_platform.sql), payout_status (20261016_full_platform.sql)

## public.ai_credit_ledger

Sumber: `20261016_full_platform.sql`

- id uuid primary key default gen_random_uuid()
- user_id uuid not null references auth.users (id) on delete cascade
- amount int not null
- balance_after int not null
- reason text not null default ''
- ref_job_id uuid references public.ai_jobs (id) on delete set null
- idempotency_key text not null unique
- created_at timestamptz not null default now()
- constraint amount_nonzero check (amount <> 0)

Policy (0): service role saja

## public.ai_jobs

Sumber: `20261015_fase1_profiles_jobs.sql`

- id uuid primary key default gen_random_uuid()
- owner_id uuid not null references auth.users (id) on delete cascade
- source_r2_key text not null
- source_bytes bigint not null default 0
- source_mime text not null default 'video/mp4'
- status ai_job_status not null default 'queued'
- idempotency_key text not null unique
- attempts int not null default 0
- lease_until timestamptz
- last_error text
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
- constraint source_bytes_range check (source_bytes >= 0 and source_bytes <= 2147483648)
- constraint r2_key_len check (char_length(source_r2_key) between 1 and 512)

Policy (2): jobs_read_own (20261015_fase1_profiles_jobs.sql), jobs_insert_own (20261015_fase1_profiles_jobs.sql)

## public.applications

Sumber: `20261016_full_platform.sql`

- id uuid primary key default gen_random_uuid()
- campaign_id uuid not null references public.campaigns (id) on delete cascade
- editor_id uuid not null references auth.users (id) on delete cascade
- status application_status not null default 'applied'
- accepted_at timestamptz
- due_at timestamptz
- created_at timestamptz not null default now()
- unique (campaign_id, editor_id)

Policy (2): apps_read_party (20261016_full_platform.sql), apps_apply_own (20261016_full_platform.sql)

## public.campaigns

Sumber: `20261016_full_platform.sql`

- id uuid primary key default gen_random_uuid()
- creator_id uuid not null references auth.users (id) on delete cascade
- title text not null
- brief text not null default ''
- source_url text
- source_r2_key text
- budget_total bigint not null
- budget_remaining bigint not null
- rate_per_1000_views bigint not null
- cap_per_clip bigint not null
- deadline_at timestamptz
- status campaign_status not null default 'draft'
- escrow escrow_status not null default 'pending'
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
- constraint budget_pos check (budget_total > 0 and budget_remaining >= 0 and budget_remaining <= budget_total)
- constraint rate_pos check (rate_per_1000_views > 0 and cap_per_clip > 0)
- constraint title_len check (char_length(title) between 4 and 120)

Policy (3): campaigns_read_open (20261016_full_platform.sql), campaigns_insert_creator (20261016_full_platform.sql), campaigns_update_own (20261016_full_platform.sql)

## public.clips

Sumber: `20261016_full_platform.sql`

- id uuid primary key default gen_random_uuid()
- job_id uuid references public.ai_jobs (id) on delete set null
- submission_id uuid references public.submissions (id) on delete set null
- r2_key text not null
- thumb_r2_key text
- title text not null default ''
- description text not null default ''
- hashtags text[] not null default '{}'
- platform text
- created_at timestamptz not null default now()
- constraint one_source check (

Policy (1): clips_read_party (20261016_full_platform.sql)

## public.edit_plans

Sumber: `20261016_full_platform.sql`

- id uuid primary key default gen_random_uuid()
- job_id uuid not null references public.ai_jobs (id) on delete cascade
- version int not null default 1
- plan jsonb not null
- created_at timestamptz not null default now()
- unique (job_id, version)

Policy (1): plans_read_job_owner (20261016_full_platform.sql)

## public.effects

Sumber: `20261016_full_platform.sql`

- id text primary key
- kind text not null
- label text not null
- config jsonb not null default '{}'
- created_at timestamptz not null default now()
- constraint effect_kind check (kind in ('sfx', 'sticker', 'zoom', 'freeze'))

Policy (1): effects_read_all (20261016_full_platform.sql)

## public.kyc_access_log

Sumber: `20261016_full_platform.sql`

- id uuid primary key default gen_random_uuid()
- doc_id uuid not null references public.kyc_documents (id) on delete cascade
- accessor uuid
- reason text not null default ''
- accessed_at timestamptz not null default now()

Policy (0): service role saja

## public.kyc_documents

Sumber: `20261016_full_platform.sql`

- id uuid primary key default gen_random_uuid()
- user_id uuid not null references auth.users (id) on delete cascade
- doc_type text not null default 'KTP'
- file_r2_key text not null
- status text not null default 'pending'
- created_at timestamptz not null default now()
- constraint kyc_status check (status in ('pending', 'approved', 'rejected'))

Policy (2): kyc_read_own (20261016_full_platform.sql), kyc_insert_own (20261016_full_platform.sql)

## public.money_ledger

Sumber: `20261016_full_platform.sql`

- id uuid primary key default gen_random_uuid()
- group_id uuid not null
- account text not null
- user_id uuid references auth.users (id) on delete set null
- campaign_id uuid references public.campaigns (id) on delete set null
- submission_id uuid references public.submissions (id) on delete set null
- debit bigint not null default 0
- credit bigint not null default 0
- currency text not null default 'IDR'
- idempotency_key text not null unique
- created_at timestamptz not null default now()
- constraint one_side check (

Policy (0): service role saja

## public.payout_accounts

Sumber: `20261016_full_platform.sql`

- id uuid primary key default gen_random_uuid()
- user_id uuid not null references auth.users (id) on delete cascade
- provider text not null
- account_ref text not null
- account_name text not null
- is_verified boolean not null default false
- verified_at timestamptz
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
- constraint provider_len check (char_length(provider) between 2 and 40)

Policy (3): payout_read_own (20261016_full_platform.sql), payout_write_own (20261016_full_platform.sql), payout_update_own (20261016_full_platform.sql)

## public.payouts

Sumber: `20261016_full_platform.sql`

- id uuid primary key default gen_random_uuid()
- editor_id uuid not null references auth.users (id) on delete cascade
- amount bigint not null
- fee bigint not null default 0
- xendit_id text unique
- status payout_status not null default 'queued'
- idempotency_key text not null unique
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
- constraint payout_pos check (amount > 0 and fee >= 0 and fee <= amount)

Policy (1): payouts_read_own (20261016_full_platform.sql)

## public.profile_private

Sumber: `20261015_fase1_profiles_jobs.sql`

- user_id uuid primary key references auth.users (id) on delete cascade
- full_name text
- phone text
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Policy (3): private_read_own (20261015_fase1_profiles_jobs.sql), private_update_own (20261015_fase1_profiles_jobs.sql), private_insert_own (20261015_fase1_profiles_jobs.sql)

## public.profiles

Sumber: `20261015_fase1_profiles_jobs.sql`

- id uuid primary key references auth.users (id) on delete cascade
- role user_role not null default 'creator'
- display_name text not null default ''
- avatar_url text
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
- constraint display_name_len check (char_length(display_name) <= 60)

Policy (3): profiles_read_all (20261015_fase1_profiles_jobs.sql), profiles_update_own (20261015_fase1_profiles_jobs.sql), profiles_insert_own (20261015_fase1_profiles_jobs.sql)

## public.settings

Sumber: `20261016_full_platform.sql`

- key text primary key
- value jsonb not null
- updated_at timestamptz not null default now()

Policy (1): settings_read_all (20261016_full_platform.sql)

## public.submissions

Sumber: `20261016_full_platform.sql`

- id uuid primary key default gen_random_uuid()
- application_id uuid not null references public.applications (id) on delete cascade
- file_r2_key text
- status submission_status not null default 'draft'
- posted_url text
- posted_platform text
- posted_at timestamptz
- views_final bigint
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
- constraint posted_check check (

Policy (2): subs_read_party (20261016_full_platform.sql), subs_insert_editor (20261016_full_platform.sql)

## public.view_snapshots

Sumber: `20261016_full_platform.sql`

- id uuid primary key default gen_random_uuid()
- submission_id uuid not null references public.submissions (id) on delete cascade
- platform text not null
- views bigint not null default 0
- snapshot_date date not null
- raw jsonb
- created_at timestamptz not null default now()
- unique (submission_id, platform, snapshot_date)

Policy (1): views_read_party (20261016_full_platform.sql)

