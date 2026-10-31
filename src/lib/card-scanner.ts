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
