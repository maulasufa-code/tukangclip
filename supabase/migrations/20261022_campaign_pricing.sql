-- Harga kampanye: biaya platform 15% di atas budget, minimal top-up Rp3 jt.
-- Hitungannya ada di docs/harga-kampanye.md. Kunci terpisah dari platform_fee_pct,
-- yang tetap dipakai untuk top-up kredit AI.
insert into public.settings (key, value) values
  ('campaign_fee_pct', '{"value": 15}'),
  ('min_campaign_topup_idr', '{"value": 3000000}')
on conflict (key) do nothing;
