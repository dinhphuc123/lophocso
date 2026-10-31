import test from "node:test";
import assert from "node:assert/strict";
import { getCardMatrix, generateCardSvg, ARUCO_4X4_PATTERNS } from "../src/lib/card-scanner";

test("card-scanner: generates 6x6 matrix with black outer border", () => {
  const matrix = getCardMatrix(1);
  assert.equal(matrix.length, 6);
  assert.equal(matrix[0].length, 6);

  // Outer border must be 0 (black)
  for (let c = 0; c < 6; c++) {
    assert.equal(matrix[0][c], 0, "Top border must be 0");
    assert.equal(matrix[5][c], 0, "Bottom border must be 0");
    assert.equal(matrix[c][0], 0, "Left border must be 0");
    assert.equal(matrix[c][5], 0, "Right border must be 0");
  }

  // Check pattern of student 1: [0x7, 0x2, 0xd, 0x1]
  // 0x7 = 0111 -> [0, 1, 1, 1]
  assert.equal(matrix[1][1], 0);
  assert.equal(matrix[1][2], 1);
  assert.equal(matrix[1][3], 1);
  assert.equal(matrix[1][4], 1);
});

test("card-scanner: generateCardSvg contains labels A, B, C, D and student id", () => {
  const svg = generateCardSvg(5, "Nguyễn Văn A");
  assert.ok(svg.includes("▲ A"));
  assert.ok(svg.includes("▲ B"));
  assert.ok(svg.includes("▲ C"));
  assert.ok(svg.includes("▲ D"));
  assert.ok(svg.includes("#5"));
  assert.ok(svg.includes("Nguyễn Văn A"));
  assert.ok(svg.includes("<svg"));
});
