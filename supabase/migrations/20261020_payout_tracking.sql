-- Penanda fraud dan tautan payout ke submission.
alter table public.submissions
  add column if not exists flagged boolean not null default false,
  add column if not exists dispute text not null default '';

alter table public.payouts
  add column if not exists submission_id uuid references public.submissions (id) on delete set null;

alter table public.topup_intents
  add column if not exists campaign_id uuid references public.campaigns (id) on delete set null;

create index if not exists payouts_submission_idx on public.payouts (submission_id);

insert into public.settings (key, value) values
  ('spike_multiplier', '{"value": 10}'),
  ('spike_min_views', '{"value": 1000}')
on conflict (key) do nothing;
