# Worker Render (FFmpeg cepat plus Remotion final)

Dua tahap. FFmpeg memotong dan reframe 9:16 plus ducking audio, cepat di CPU.
Remotion merender caption animasi dan zoom presisi untuk hasil final.

## File

- `src/effects.json`: 11 ID efek valid. LLM hanya boleh pilih dari sini.
- `src/validator.ts`: `sanitizeCues` membuang ID asing, menggeser efek
  0,1-0,3 detik setelah punchline, maksimal 1 efek per 6 detik (skor tertinggi
  menang), menolak yang tumpang tindih, menandai ducking untuk SFX.
- `src/render-plan.ts`: edit plan plus kata transkrip jadi segmen render.
- `src/ffmpeg.ts`: filter reframe, concat, ducking, dan campur SFX.
- `src/worker.ts`: loop `claim_next_render_job()`, tulis `clips`, status `done`.
- `remotion/Clip.tsx`: caption kata aktif kuning, zoom punch-in, hook 3 detik.

## Jalan lokal

1. `npm install`, `npm test` (9 tes), `node scripts/smoke.mjs` (butuh ffmpeg).
2. Seed efek: `npm run db:effects`, jalankan `supabase/seed/effects.sql`.
3. Render final di VPS: `npx remotion render remotion/index.tsx Clip props.json out.mp4`.
