import test from "node:test";
import assert from "node:assert/strict";
import {
  getCardMatrix,
  rotateMatrix90,
  matchCardMatrix,
  decodeRgbaPatchTo6x6,
} from "../src/lib/card-scanner";

test("card-scanner: matches student cards across all 4 rotations (A, B, C, D)", () => {
  const m1A = getCardMatrix(1);
  const m1B = rotateMatrix90(m1A);
  const m1C = rotateMatrix90(m1B);
  const m1D = rotateMatrix90(m1C);

  assert.deepEqual(matchCardMatrix(m1A), { studentId: 1, choice: "A", distance: 0 });
  assert.deepEqual(matchCardMatrix(m1B), { studentId: 1, choice: "B", distance: 0 });
  assert.deepEqual(matchCardMatrix(m1C), { studentId: 1, choice: "C", distance: 0 });
  assert.deepEqual(matchCardMatrix(m1D), { studentId: 1, choice: "D", distance: 0 });

  // Student #25 rotated 180 deg -> C, with 1 bit noise inside 4x4 payload
  const m25C = rotateMatrix90(rotateMatrix90(getCardMatrix(25)));
  m25C[2][2] = m25C[2][2] === 1 ? 0 : 1;
  const noisyMatch = matchCardMatrix(m25C);
  assert.ok(noisyMatch);
  assert.equal(noisyMatch.studentId, 25);
  assert.equal(noisyMatch.choice, "C");
  assert.equal(noisyMatch.distance, 1);
});

test("card-scanner: rejects non-card white border and decodes RGBA patch", () => {
  const allWhite = Array.from({ length: 6 }, () => Array(6).fill(1));
  assert.equal(matchCardMatrix(allWhite), null);

  // Synthesize a 60x60 RGBA image from student #7 rotated 90 deg (choice B)
  const target = rotateMatrix90(getCardMatrix(7));
  const rgba = new Uint8ClampedArray(60 * 60 * 4);
  for (let y = 0; y < 60; y++) {
    for (let x = 0; x < 60; x++) {
      const r = Math.floor(y / 10);
      const c = Math.floor(x / 10);
      const val = target[r][c] === 1 ? 230 : 25; // simulated uneven lighting (25 vs 230)
      const idx = (y * 60 + x) * 4;
      rgba[idx] = val;
      rgba[idx + 1] = val;
      rgba[idx + 2] = val;
      rgba[idx + 3] = 255;
    }
  }

  const grid = decodeRgbaPatchTo6x6(rgba, 60, 60);
  const decoded = matchCardMatrix(grid);
  assert.deepEqual(decoded, { studentId: 7, choice: "B", distance: 0 });
});
