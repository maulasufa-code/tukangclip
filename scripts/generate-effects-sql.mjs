import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const lib = JSON.parse(
  fs.readFileSync(path.join(root, "workers", "render", "src", "effects.json"), "utf8")
);
const out = path.join(root, "supabase", "seed", "effects.sql");

const lines = [
  "-- Seed library efek dari workers/render/src/effects.json.",
  "-- Dibuat oleh scripts/generate-effects-sql.mjs. Jalankan di SQL editor.",
  "-- Aman diulang (ON CONFLICT DO NOTHING).",
  ""
];
for (const e of lib.effects) {
  const row = `('${e.id}', '${e.kind}', '${e.label.replace(/'/g, "''")}', '${JSON.stringify({
    dur_ms: e.dur_ms,
    ...(e.duck_db !== undefined ? { duck_db: e.duck_db } : {}),
    ...(e.scale !== undefined ? { scale: e.scale } : {})
  }).replace(/'/g, "''")}')`;
  lines.push(
    `insert into public.effects (id, kind, label, config) values ${row} on conflict (id) do nothing;`
  );
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join("\n") + "\n");
console.log(`wrote ${out} (${lib.effects.length} effects)`);
