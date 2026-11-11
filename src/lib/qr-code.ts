// Minimal zero-dependency QR Code Matrix Generator (Byte mode, ECC Level L, Versions 1..6)
// Supports URLs up to 134 bytes (more than enough for https://domain/play?pin=XXXXXX)

const VERSION_PARAMS: Record<
  number,
  { size: number; totalCodewords: number; ecCodewords: number; align: number[] }
> = {
  1: { size: 21, totalCodewords: 26, ecCodewords: 7, align: [] },
  2: { size: 25, totalCodewords: 44, ecCodewords: 10, align: [6, 18] },
  3: { size: 29, totalCodewords: 70, ecCodewords: 15, align: [6, 22] },
  4: { size: 33, totalCodewords: 100, ecCodewords: 20, align: [6, 26] },
  5: { size: 37, totalCodewords: 134, ecCodewords: 26, align: [6, 30] },
  6: { size: 41, totalCodewords: 172, ecCodewords: 36, align: [6, 34] }, // 2 blocks of 68 data + 18 ec
};

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLen);
  const msg = new Uint8Array(data.length + ecLen);
  msg.set(data, 0);
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

export function encodeQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  let version = 1;
  while (version <= 6) {
    const p = VERSION_PARAMS[version];
    const dataCap = p.totalCodewords - p.ecCodewords;
    // 4 bits mode + 8 bits len + 8*N bits <= dataCap*8
    if (bytes.length + 2 <= dataCap) break;
    version++;
  }
  if (version > 6) version = 6;

  const { size, totalCodewords, ecCodewords, align } = VERSION_PARAMS[version];
  const dataCapacity = totalCodewords - ecCodewords;

  // Build bit stream
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  pushBits(0b0100, 4); // Byte mode
  const payload = bytes.slice(0, dataCapacity - 2);
  pushBits(payload.length, 8);
  for (const b of payload) pushBits(b, 8);

  // Terminator
  const maxBits = dataCapacity * 8;
  for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes = new Uint8Array(dataCapacity);
  for (let i = 0; i < bits.length / 8; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
    dataBytes[i] = b;
  }
  const pads = [0xec, 0x11];
  for (let i = bits.length / 8, pIdx = 0; i < dataCapacity; i++, pIdx ^= 1) {
    dataBytes[i] = pads[pIdx];
  }

  let finalCodewords: Uint8Array;
  if (version === 6) {
    // Version 6-L uses 2 blocks of 68 data + 18 EC codewords
    const b1 = dataBytes.slice(0, 68);
    const b2 = dataBytes.slice(68, 136);
    const ec1 = rsEncode(b1, 18);
    const ec2 = rsEncode(b2, 18);
    finalCodewords = new Uint8Array(totalCodewords);
    let k = 0;
    for (let i = 0; i < 68; i++) {
      finalCodewords[k++] = b1[i];
      finalCodewords[k++] = b2[i];
    }
    for (let i = 0; i < 18; i++) {
      finalCodewords[k++] = ec1[i];
      finalCodewords[k++] = ec2[i];
    }
  } else {
    const ecBytes = rsEncode(dataBytes, ecCodewords);
    finalCodewords = new Uint8Array(totalCodewords);
    finalCodewords.set(dataBytes, 0);
    finalCodewords.set(ecBytes, dataCapacity);
  }

  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunc: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunc[r][c] = true;
    }
  };

  // Finder patterns + separators
  const drawFinder = (r0: number, c0: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r0 + dr;
        const cc = c0 + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(rr, cc, inOuter && (onBorder || inInner));
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  if (align.length > 0) {
    for (const ar of align) {
      for (const ac of align) {
        if ((ar === 6 && ac === 6) || (ar === 6 && ac === size - 7) || (ar === size - 7 && ac === 6)) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            setFunctionModule(ar + dr, ac + dc, dark);
          }
        }
      }
    }
  }

  // Reserve format info areas & dark module
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunc[8][i] = true;
      isFunc[i][8] = true;
    }
    if (i < 8) {
      isFunc[8][size - 1 - i] = true;
      isFunc[size - 1 - i][8] = true;
    }
  }
  setFunctionModule(size - 8, 8, true);

  // Place data bits (zigzag from bottom-right)
  let bitIdx = 0;
  const totalBits = finalCodewords.length * 8;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunc[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            dark = ((finalCodewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1) === 1;
            bitIdx++;
          }
          // Apply mask 0: (r + c) % 2 === 0
          if ((r + c) % 2 === 0) dark = !dark;
          modules[r][c] = dark;
        }
      }
    }
    upward = !upward;
  }

  // Format bits for ECC Level L (01) and Mask 0 (000) -> Precomputed BCH & XOR mask = 0x77c4 (30660)
  const formatBits = 0x77c4;
  const getFmtBit = (i: number) => ((formatBits >> i) & 1) === 1;

  for (let i = 0; i <= 5; i++) modules[8][i] = getFmtBit(14 - i);
  modules[8][7] = getFmtBit(8);
  modules[8][8] = getFmtBit(7);
  modules[7][8] = getFmtBit(6);
  for (let i = 0; i <= 5; i++) modules[5 - i][8] = getFmtBit(i);

  for (let i = 0; i < 7; i++) modules[size - 1 - i][8] = getFmtBit(14 - i);
  for (let i = 0; i < 8; i++) modules[8][size - 8 + i] = getFmtBit(7 - i);

  return modules;
}
