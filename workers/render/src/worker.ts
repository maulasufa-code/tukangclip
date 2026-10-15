import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import effectsLib from "./effects.json" with { type: "json" };
import { buildSegments } from "./render-plan.js";
import { buildBaseRender, toFfmpegArgv } from "./ffmpeg.js";
import type { EffectDef } from "./validator.js";

const execFileAsync = promisify(execFile);
const env = (n: string, d = "") => process.env[n] ?? d;

function s3() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY")
    }
  });
}

async function download(key: string, dest: string) {
  const res = await s3().send(
    new GetObjectCommand({ Bucket: env("R2_BUCKET_RAW"), Key: key })
  );
  const body = res.Body as AsyncIterable<Uint8Array>;
  const ws = fs.createWriteStream(dest);
  for await (const chunk of body) ws.write(chunk);
  ws.end();
  await new Promise<void>((resolve) => ws.on("finish", () => resolve()));
}

async function upload(key: string, file: string, mime = "video/mp4") {
  await s3().send(
    new PutObjectCommand({
      Bucket: env("R2_BUCKET_CLIPS", env("R2_BUCKET_RAW")),
      Key: key,
      Body: fs.createReadStream(file),
      ContentType: mime
    })
  );
}

function latestPlan(plans: { version: number; plan: unknown }[]) {
  const sorted = [...plans].sort((a, b) => b.version - a.version);
  return sorted[0];
}

export async function renderJob(jobId: string) {
  const supa = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  const { data: job } = await supa.from("ai_jobs").select("*").eq("id", jobId).single();
  if (!job) throw new Error("job tidak ditemukan");

  const { data: plans } = await supa.from("edit_plans").select("version,plan").eq("job_id", jobId);
  const plan = latestPlan(plans ?? [])?.plan as {
    moments: { start: number; end: number; hook: string; effects?: { effect_id: string; beat: number }[] }[];
  };
  if (!plan) throw new Error("edit plan belum ada");

  const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "clip-"));
  const src = path.join(tmp, "src.mp4");
  const out = path.join(tmp, "base.mp4");
  await download(job.source_r2_key as string, src);

  const segments = buildSegments(plan.moments, [], effectsLib.effects as EffectDef[]);
  const args = buildBaseRender(src, segments, {}, out);
  await execFileAsync("ffmpeg", toFfmpegArgv(args), { timeout: 20 * 60 * 1000 });

  const r2key = `clips/${jobId}/base.mp4`;
  await upload(r2key, out);
  await supa.from("clips").insert({ job_id: jobId, r2_key: r2key });
  await supa.from("ai_jobs").update({ status: "done", lease_until: null }).eq("id", jobId);
  return { r2key, moments: segments.length };
}

async function loop() {
  const supa = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  for (;;) {
    const { data } = await supa.rpc("claim_next_render_job", {});
    const job = Array.isArray(data) ? data[0] : data;
    if (!job) {
      await new Promise((r) => setTimeout(r, 10_000));
      continue;
    }
    try {
      await renderJob(job.id as string);
    } catch (e) {
      await supa
        .from("ai_jobs")
        .update({ status: "failed", last_error: String(e).slice(0, 500) })
        .eq("id", job.id as string);
    }
  }
}

if (process.argv[1]?.endsWith("worker.js")) void loop();
