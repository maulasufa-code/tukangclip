import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import { buildBaseRender, toFfmpegArgv } from "../dist/src/ffmpeg.js";

const exec = promisify(execFile);
const tmp = process.env.TEMP ?? "/tmp";

async function main() {
  const src = `${tmp}/smoke-src.mp4`;
  const out = `${tmp}/smoke-base.mp4`;
  await exec("ffmpeg", [
    "-y", "-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=12",
    "-f", "lavfi", "-i", "sine=frequency=440:duration=12",
    "-c:v", "libx264", "-c:a", "aac", "-shortest", src
  ]);
  const seg = { start: 1, end: 9, hook: "Dengar ini", captions: [], zooms: [], cues: [] };
  const args = buildBaseRender(src, [seg], {}, out);
  await exec("ffmpeg", toFfmpegArgv(args));
  const st = fs.statSync(out);
  const probe = await exec("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height", "-of", "csv=p=0", out
  ]);
  console.log("smoke-ok", st.size, "bytes,", probe.stdout.trim());
  if (!probe.stdout.includes("1080,1920")) throw new Error("bukan 9:16");
}

main().catch((e) => {
  console.error("smoke-gagal:", e.message);
  process.exit(1);
});
