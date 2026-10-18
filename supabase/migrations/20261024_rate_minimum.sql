-- Rate per 1.000 views minimal Rp1.000. NOT VALID: hanya baris baru yang dicek,
-- supaya baris lama dengan rate kecil tidak membuat migrasi gagal.
alter table public.campaigns
  add constraint rate_min check (rate_per_1000_views >= 1000) not valid;
