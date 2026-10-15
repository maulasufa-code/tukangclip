import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSegments } from "../dist/src/render-plan.js";
import { buildBaseRender, duckVolumeExpr, reframeFilter, toFfmpegArgv } from "../dist/src/ffmpeg.js";

const FX = [
  { id: "sfx_tawa_01", kind: "sfx", label: "Tawa", dur_ms: 1200, duck_db: -6 },
  { id: "zoom_punch_01", kind: "zoom", label: "Punch", dur_ms: 400, scale: 1.15 }
];

describe("render plan dan ffmpeg", () => {
  it("reframe memotong vertikal 9:16", () => {
    const f = reframeFilter({ start: 0, end: 35 });
    assert.match(f, /crop=w=ih\*9\/16/);
    assert.match(f, /scale=1080:1920/);
  });

  it("ducking menurunkan volume saat SFX", () => {
    const expr = duckVolumeExpr([{ at: 5, dur_ms: 1200, duck_db: -6 }]);
    assert.match(expr, /between\(t,5\.00,6\.20\)/);
    assert.match(expr, /0\.501/);
  });

  it("segmen membawa caption dan zoom dari cue", () => {
    const words = [
      { word: "halo", start: 1, end: 1.4 },
      { word: "guys", start: 40, end: 40.5 }
    ];
    const segs = buildSegments(
      [{ start: 0, end: 35, hook: "Dengar ini", effects: [{ effect_id: "zoom_punch_01", beat: 5 }] }],
      words,
      FX
    );
    assert.equal(segs[0].captions.length, 1);
    assert.ok(segs[0].zooms.length >= 3);
  });

  it("argv ffmpeg memetakan video dan audio", () => {
    const args = buildBaseRender("in.mp4", [{ start: 0, end: 5, hook: "", captions: [], zooms: [], cues: [] }], {}, "out.mp4");
    const argv = toFfmpegArgv(args);
    assert.ok(argv.includes("[vout]") && argv.includes("[aout]") && argv.includes("out.mp4"));
  });
});
