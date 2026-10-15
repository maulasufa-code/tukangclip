-- Seed library efek dari workers/render/src/effects.json.
-- Dibuat oleh scripts/generate-effects-sql.mjs. Jalankan di SQL editor.
-- Aman diulang (ON CONFLICT DO NOTHING).

insert into public.effects (id, kind, label, config) values ('sfx_tawa_01', 'sfx', 'Tawa pendek', '{"dur_ms":1200,"duck_db":-6}') on conflict (id) do nothing;
insert into public.effects (id, kind, label, config) values ('sfx_tepuk_01', 'sfx', 'Tepuk tangan', '{"dur_ms":1800,"duck_db":-5}') on conflict (id) do nothing;
insert into public.effects (id, kind, label, config) values ('sfx_dramatic_01', 'sfx', 'Dramatic hit', '{"dur_ms":900,"duck_db":-8}') on conflict (id) do nothing;
insert into public.effects (id, kind, label, config) values ('sfx_pop_01', 'sfx', 'Pop ringan', '{"dur_ms":400,"duck_db":-3}') on conflict (id) do nothing;
insert into public.effects (id, kind, label, config) values ('stk_ngakak_01', 'sticker', 'Stiker ngakak', '{"dur_ms":2000}') on conflict (id) do nothing;
insert into public.effects (id, kind, label, config) values ('stk_kaget_01', 'sticker', 'Stiker kaget', '{"dur_ms":1500}') on conflict (id) do nothing;
insert into public.effects (id, kind, label, config) values ('stk_api_01', 'sticker', 'Stiker api', '{"dur_ms":2500}') on conflict (id) do nothing;
insert into public.effects (id, kind, label, config) values ('zoom_punch_01', 'zoom', 'Punch-in cepat', '{"dur_ms":400,"scale":1.15}') on conflict (id) do nothing;
insert into public.effects (id, kind, label, config) values ('zoom_out_01', 'zoom', 'Zoom-out lega', '{"dur_ms":800,"scale":1}') on conflict (id) do nothing;
insert into public.effects (id, kind, label, config) values ('freeze_01', 'freeze', 'Freeze punchline', '{"dur_ms":800}') on conflict (id) do nothing;
insert into public.effects (id, kind, label, config) values ('freeze_zoom_01', 'freeze', 'Freeze plus zoom', '{"dur_ms":1200,"scale":1.1}') on conflict (id) do nothing;
