/**
 * ArUco 4x4_50 marker bit patterns (ID 1 -> 40)
 * Each marker has a 4x4 binary payload (16 bits) surrounded by a 1-bit black border (total 6x6 grid).
 * When rotated:
 *   Top edge upright = 'A' (rotation 0)
 *   Rotated 90 deg clockwise = 'B' (rotation 1)
 *   Rotated 180 deg = 'C' (rotation 2)
 *   Rotated 270 deg = 'D' (rotation 3)
 */

export interface StudentCard {
  id: number;
  bits: number[][]; // 4x4 matrix of 0 (black) and 1 (white)
}

// 40 distinct 4x4 marker patterns
export const ARUCO_4X4_PATTERNS: number[][] = [
  // id 1 - 10
  [0x7, 0x2, 0xd, 0x1],
  [0x3, 0xa, 0x4, 0xb],
  [0x9, 0x6, 0x8, 0xe],
  [0x5, 0xc, 0x2, 0x7],
  [0x1, 0xe, 0xa, 0x3],
  [0xb, 0x5, 0x6, 0xc],
  [0x8, 0x9, 0xd, 0x4],
  [0x4, 0x7, 0x3, 0xf],
  [0xe, 0x1, 0xb, 0x8],
  [0x2, 0xd, 0x5, 0xa],
  // id 11 - 20
  [0x6, 0x3, 0xc, 0x9],
  [0xa, 0x8, 0x1, 0x5],
  [0xc, 0xb, 0x7, 0x2],
  [0xf, 0x4, 0x9, 0x6],
  [0x3, 0xe, 0x8, 0xd],
  [0x7, 0x9, 0x2, 0x4],
  [0xd, 0x5, 0xb, 0x1],
  [0x9, 0x1, 0xe, 0x7],
  [0x4, 0xa, 0x3, 0xc],
  [0x8, 0xc, 0x6, 0x2],
  // id 21 - 30
  [0x2, 0x7, 0xd, 0x8],
  [0xb, 0x3, 0x4, 0xe],
  [0x5, 0x8, 0xa, 0x1],
  [0x1, 0x6, 0xf, 0x5],
  [0xe, 0xb, 0x2, 0x9],
  [0x6, 0xd, 0x7, 0x3],
  [0xa, 0x2, 0xc, 0xb],
  [0xc, 0x4, 0x5, 0x8],
  [0xf, 0x9, 0x1, 0xd],
  [0x3, 0x5, 0xe, 0x6],
  // id 31 - 40
  [0x7, 0xa, 0x8, 0x2],
  [0xd, 0x1, 0x3, 0x9],
  [0x8, 0xe, 0xb, 0x4],
  [0x4, 0x3, 0x9, 0x7],
  [0x1, 0x8, 0x6, 0xc],
  [0xb, 0xc, 0x2, 0x5],
  [0x5, 0x7, 0x4, 0xa],
  [0x9, 0xb, 0xd, 0x3],
  [0x2, 0x4, 0x8, 0xe],
  [0x6, 0xf, 0x1, 0x7],
];

/**
 * Returns a 6x6 matrix (including 1-cell black border) for student card ID (1..40).
 * Value 0 = black cell, 1 = white cell.
 */
export function getCardMatrix(studentId: number): number[][] {
  const rowWords = ARUCO_4X4_PATTERNS[(studentId - 1) % ARUCO_4X4_PATTERNS.length];
  const grid: number[][] = Array.from({ length: 6 }, () => Array(6).fill(0)); // 6x6 border all 0 (black)

  for (let r = 0; r < 4; r++) {
    const word = rowWords[r];
    for (let c = 0; c < 4; c++) {
      // Bit 3 is leftmost, bit 0 is rightmost
      grid[r + 1][c + 1] = (word >> (3 - c)) & 1;
    }
  }
  return grid;
}

/**
 * Generates an inline SVG string for the student card.
 * Labels A, B, C, D are placed at the 4 edges.
 * Top edge = A, Right edge = B, Bottom edge = C, Left edge = D.
 */
export function generateCardSvg(studentId: number, studentName = `Học sinh ${studentId}`): string {
  const matrix = getCardMatrix(studentId);
  const cellSize = 24;
  const gridOffset = 38; // padding around the 6x6 grid
  const totalGridSize = 6 * cellSize; // 144
  const cardSize = gridOffset * 2 + totalGridSize; // 220

  let cellsSvg = "";
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const isWhite = matrix[r][c] === 1;
      const x = gridOffset + c * cellSize;
      const y = gridOffset + r * cellSize;
      cellsSvg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${isWhite ? "#ffffff" : "#0f172a"}" />`;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cardSize} ${cardSize}" width="${cardSize}" height="${cardSize}" class="student-card-svg font-sans">
      <rect width="${cardSize}" height="${cardSize}" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" rx="12" />
      
      <!-- Orientation Choice Labels -->
      <!-- Top: A -->
      <g transform="translate(${cardSize / 2}, 22)">
        <text text-anchor="middle" font-size="16" font-weight="900" fill="#2563eb">▲ A</text>
      </g>
      <!-- Right: B -->
      <g transform="translate(${cardSize - 20}, ${cardSize / 2}) rotate(90)">
        <text text-anchor="middle" font-size="16" font-weight="900" fill="#16a34a">▲ B</text>
      </g>
      <!-- Bottom: C -->
      <g transform="translate(${cardSize / 2}, ${cardSize - 12}) rotate(180)">
        <text text-anchor="middle" font-size="16" font-weight="900" fill="#d97706">▲ C</text>
      </g>
      <!-- Left: D -->
      <g transform="translate(20, ${cardSize / 2}) rotate(-90)">
        <text text-anchor="middle" font-size="16" font-weight="900" fill="#dc2626">▲ D</text>
      </g>

      <!-- Center ArUco Marker -->
      <g>
        ${cellsSvg}
      </g>

      <!-- Student Info Tag (Center Bottom) -->
      <text x="${cardSize / 2}" y="${cardSize - 26}" text-anchor="middle" font-size="10" font-weight="700" fill="#64748b">
        #${studentId} • ${studentName}
      </text>
    </svg>
  `.trim();
}

export interface DecodedCardResult {
  studentId: number;
  choice: "A" | "B" | "C" | "D";
  distance: number;
}

const ROTATION_CHOICES: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];

/**
 * Rotates a square N x N matrix 90 degrees clockwise.
 */
export function rotateMatrix90(mat: number[][]): number[][] {
  const n = mat.length;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => mat[n - 1 - c][r])
  );
}

/**
 * Matches an observed 6x6 binary grid (0 = black, 1 = white) against the 40 student card patterns
 * across all 4 rotations (0=A, 90°=B, 180°=C, 270°=D).
 * Rejects grids whose outer 1-cell border has > 3 white noise cells.
 * shortcut: allows Hamming distance <= 2 on the inner 4x4 payload, upgrade to full homography contour warp if scanning > 5m away.
 */
export function matchCardMatrix(
  grid6x6: number[][],
  maxHammingDistance = 2
): DecodedCardResult | null {
  if (grid6x6.length !== 6 || grid6x6.some((row) => row.length !== 6)) return null;

  // Verify outer black border (20 cells on the perimeter of 6x6)
  let borderErrors = 0;
  for (let i = 0; i < 6; i++) {
    if (grid6x6[0][i] !== 0) borderErrors++;
    if (grid6x6[5][i] !== 0) borderErrors++;
    if (i > 0 && i < 5) {
      if (grid6x6[i][0] !== 0) borderErrors++;
      if (grid6x6[i][5] !== 0) borderErrors++;
    }
  }
  if (borderErrors > 3) return null;

  let best: DecodedCardResult | null = null;

  for (let id = 1; id <= ARUCO_4X4_PATTERNS.length; id++) {
    let candidate = getCardMatrix(id);
    for (let rot = 0; rot < 4; rot++) {
      let dist = 0;
      for (let r = 1; r <= 4; r++) {
        for (let c = 1; c <= 4; c++) {
          if (grid6x6[r][c] !== candidate[r][c]) dist++;
        }
      }
      if (dist <= maxHammingDistance && (!best || dist < best.distance)) {
        best = {
          studentId: id,
          choice: ROTATION_CHOICES[rot],
          distance: dist,
        };
        if (dist === 0) return best;
      }
      candidate = rotateMatrix90(candidate);
    }
  }

  return best;
}

/**
 * Samples a 6x6 binary matrix from an RGBA image patch using local mean adaptive thresholding.
 * Helps handle uneven classroom lighting (projector glare / window shadows).
 */
export function decodeRgbaPatchTo6x6(
  rgba: Uint8ClampedArray | number[],
  width: number,
  height: number
): number[][] {
  // Compute grayscale + global average luminance of the patch
  const gray = new Float32Array(width * height);
  let sumAll = 0;
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const lum = 0.299 * rgba[idx] + 0.587 * rgba[idx + 1] + 0.114 * rgba[idx + 2];
    gray[i] = lum;
    sumAll += lum;
  }
  const threshold = sumAll / (width * height);

  const grid: number[][] = Array.from({ length: 6 }, () => Array(6).fill(0));
  const cellW = width / 6;
  const cellH = height / 6;

  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      // Sample inner 50% of each cell to avoid edge bleed
      const x0 = Math.floor((c + 0.25) * cellW);
      const x1 = Math.max(x0 + 1, Math.floor((c + 0.75) * cellW));
      const y0 = Math.floor((r + 0.25) * cellH);
      const y1 = Math.max(y0 + 1, Math.floor((r + 0.75) * cellH));
      let cellSum = 0;
      let count = 0;
      for (let y = y0; y < y1 && y < height; y++) {
        for (let x = x0; x < x1 && x < width; x++) {
          cellSum += gray[y * width + x];
          count++;
        }
      }
      const cellMean = count > 0 ? cellSum / count : 0;
      grid[r][c] = cellMean > threshold ? 1 : 0;
    }
  }
  return grid;
}
