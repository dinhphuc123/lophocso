import test from "node:test";
import assert from "node:assert/strict";
import { encodeQrMatrix } from "../src/lib/qr-code";

test("qr-code: generates valid square matrix with finder patterns for join URL", () => {
  const url = "https://lophocso.edu.vn/play?pin=789201";
  const matrix = encodeQrMatrix(url);

  assert.ok(matrix.length >= 21 && matrix.length <= 41);
  assert.equal(matrix.length % 4, 1);
  for (const row of matrix) {
    assert.equal(row.length, matrix.length);
  }

  // Top-left finder pattern 7x7 corners and center must be dark
  assert.equal(matrix[0][0], true);
  assert.equal(matrix[0][6], true);
  assert.equal(matrix[6][0], true);
  assert.equal(matrix[6][6], true);
  assert.equal(matrix[3][3], true);
  assert.equal(matrix[1][1], false);
});
