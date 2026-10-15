import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dir = path.join(root, "supabase", "migrations");
const out = path.join(root, "docs", "DATABASE_MAP.generated.md");

function splitTopLevel(s) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const tables = new Map();
const policies = new Map();
const types = new Set();

for (const f of files) {
  const sql = fs.readFileSync(path.join(dir, f), "utf8");
  for (const m of sql.matchAll(/create\s+type\s+(\w+)/gi)) {
    types.add(`${m[1]} (${f})`);
  }
  for (const m of sql.matchAll(/create\s+table\s+if\s+not\s+exists\s+public\.(\w+)\s*\(([\s\S]*?)\n\);/gi)) {
    const name = m[1];
    const cols = splitTopLevel(m[2])
      .map((c) => c.trim().split("\n")[0].trim())
      .filter(Boolean)
      .map((c) => c.replace(/\s+/g, " "));
    if (!tables.has(name)) tables.set(name, { cols, file: f });
  }
  for (const m of sql.matchAll(/create\s+policy\s+"([^"]+)"\s+on\s+public\.(\w+)/gi)) {
    const list = policies.get(m[2]) ?? [];
    list.push(`${m[1]} (${f})`);
    policies.set(m[2], list);
  }
}

let md = `# DATABASE_MAP generated\n\n`;
md += `Dibuat otomatis dari SQL. Jangan edit manual. Jalankan \`npm run db:map\`.\n\n`;
md += `Migrasi terbaca: ${files.join(", ")}\n\n`;
md += `Tipe: ${types.size ? [...types].join(", ") : "-"}\n\n`;

for (const [name, t] of [...tables.entries()].sort()) {
  md += `## public.${name}\n\nSumber: \`${t.file}\`\n\n`;
  for (const c of t.cols) md += `- ${c}\n`;
  const p = policies.get(name) ?? [];
  md += `\nPolicy (${p.length}): ${p.length ? p.join(", ") : "service role saja"}\n\n`;
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md);
console.log(`wrote ${out} (${tables.size} tables)`);
