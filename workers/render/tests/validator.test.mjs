import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeCues } from "../dist/src/validator.js";

const FX = [
  { id: "sfx_tawa_01", kind: "sfx", label: "Tawa", dur_ms: 1200, duck_db: -6 },
  { id: "zoom_punch_01", kind: "zoom", label: "Punch", dur_ms: 400, scale: 1.15 },
  { id: "stk_ngakak_01", kind: "sticker", label: "Ngakak", dur_ms: 2000 }
];

describe("validator penempel efek", () => {
  it("membuang id yang tidak dikenal", () => {
    const r = sanitizeCues([{ effect_id: "sfx_hantu_99", beat: 10 }], FX);
    assert.equal(r.cues.length, 0);
    assert.equal(r.dropped[0].reason, "id efek tidak dikenal");
  });

  it("menggeser 0,1-0,3 detik setelah punchline", () => {
    const r = sanitizeCues([{ effect_id: "sfx_tawa_01", beat: 10 }], FX, { offset: 0.2 });
    assert.equal(r.cues[0].at, 10.2);
  });

  it("maksimal 1 efek per 6 detik, skor tertinggi menang", () => {
    const r = sanitizeCues(
      [
        { effect_id: "stk_ngakak_01", beat: 10, score: 50 },
        { effect_id: "sfx_tawa_01", beat: 12, score: 90 }
      ],
      FX
    );
    assert.equal(r.cues.length, 1);
    assert.equal(r.cues[0].effect_id, "sfx_tawa_01");
  });

  it("membuang yang tumpang tindih", () => {
    const r = sanitizeCues(
      [
        { effect_id: "stk_ngakak_01", beat: 10, score: 90 },
        { effect_id: "zoom_punch_01", beat: 11, score: 10 }
      ],
      FX
    );
    assert.equal(r.cues.length, 1);
    assert.equal(r.cues[0].effect_id, "stk_ngakak_01");
  });

  it("menandai ducking saat SFX", () => {
    const r = sanitizeCues([{ effect_id: "sfx_tawa_01", beat: 5 }], FX);
    assert.equal(r.cues[0].duck_db, -6);
  });
});
