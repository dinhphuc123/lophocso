import JSZip from "jszip";

/**
 * Phân tích file Excel (.xlsx) hoặc CSV để trích xuất danh sách họ tên học sinh.
 * Sử dụng JSZip có sẵn, không cần cài thêm thư viện nặng.
 */
export async function parseStudentListFromFile(file: File): Promise<string[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
    const text = await file.text();
    return parseCsvText(text);
  }

  if (fileName.endsWith(".xlsx")) {
    const arrayBuffer = await file.arrayBuffer();
    return parseXlsxBuffer(arrayBuffer);
  }

  // Fallback thử đọc như text nếu đuôi khác
  const text = await file.text();
  return parseCsvText(text);
}

function normalizeHeader(str: string): string {
  return str.toLowerCase().replace(/[\s_\-:]+/g, " ").trim();
}

/**
 * Trích xuất từ file CSV
 */
function parseCsvText(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Tách dòng thành ma trận các ô
  const matrix: string[][] = lines.map((line) => {
    // Tự động nhận diện dấu phẩy, chấm phẩy hoặc tab
    const delimiter = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
    return line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, "").trim());
  });

  return extractStudentNamesFromMatrix(matrix);
}

/**
 * Trích xuất từ file .xlsx bằng JSZip và DOMParser
 */
async function parseXlsxBuffer(buffer: ArrayBuffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);

  // 1. Đọc sharedStrings.xml (nếu có)
  const sharedStrings: string[] = [];
  const sstFile = zip.file("xl/sharedStrings.xml");
  if (sstFile) {
    const sstXml = await sstFile.async("string");
    const parser = new DOMParser();
    const doc = parser.parseFromString(sstXml, "application/xml");
    const siElements = doc.getElementsByTagName("si");
    for (let i = 0; i < siElements.length; i++) {
      const tElements = siElements[i].getElementsByTagName("t");
      let val = "";
      for (let j = 0; j < tElements.length; j++) {
        val += tElements[j].textContent || "";
      }
      sharedStrings.push(val.trim());
    }
  }

  // 2. Tìm sheet đầu tiên
  let sheetFile = zip.file("xl/worksheets/sheet1.xml");
  if (!sheetFile) {
    const sheetFiles = zip.file(/^xl\/worksheets\/sheet.*\.xml$/);
    if (sheetFiles.length > 0) {
      sheetFile = sheetFiles[0];
    }
  }

  if (!sheetFile) return [];

  const sheetXml = await sheetFile.async("string");
  const parser = new DOMParser();
  const doc = parser.parseFromString(sheetXml, "application/xml");
  const rowElements = doc.getElementsByTagName("row");

  const matrix: string[][] = [];

  for (let r = 0; r < rowElements.length; r++) {
    const row = rowElements[r];
    const cellElements = row.getElementsByTagName("c");
    const rowValues: string[] = [];

    for (let c = 0; c < cellElements.length; c++) {
      const cell = cellElements[c];
      const type = cell.getAttribute("t");
      const vElem = cell.getElementsByTagName("v")[0];
      const tElem = cell.getElementsByTagName("t")[0];

      let cellValue = "";
      if (type === "s" && vElem) {
        const idx = parseInt(vElem.textContent || "0", 10);
        cellValue = sharedStrings[idx] || "";
      } else if (type === "inlineStr" && tElem) {
        cellValue = tElem.textContent || "";
      } else if (vElem) {
        cellValue = vElem.textContent || "";
      }

      // Xác định chỉ số cột từ r (ví dụ: A1 -> col 0, B1 -> col 1, C1 -> col 2)
      const cellRef = cell.getAttribute("r") || "";
      const colLetters = cellRef.replace(/[0-9]/g, "");
      const colIdx = colLettersToIndex(colLetters);

      while (rowValues.length < colIdx) {
        rowValues.push("");
      }
      rowValues[colIdx] = cellValue.trim();
    }

    if (rowValues.some((v) => v.length > 0)) {
      matrix.push(rowValues);
    }
  }

  return extractStudentNamesFromMatrix(matrix);
}

function colLettersToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64);
  }
  return Math.max(0, index - 1);
}

/**
 * Trích xuất danh sách tên học sinh từ bảng dữ liệu 2D (matrix)
 */
function extractStudentNamesFromMatrix(matrix: string[][]): string[] {
  if (matrix.length === 0) return [];

  // 1. Tìm dòng tiêu đề chứa các từ khóa học sinh / họ và tên
  let headerRowIndex = -1;
  let fullNameCol = -1;
  let lastNameCol = -1; // Họ và tên đệm
  let firstNameCol = -1; // Tên

  for (let r = 0; r < Math.min(matrix.length, 15); r++) {
    const row = matrix[r];
    for (let c = 0; c < row.length; c++) {
      const text = normalizeHeader(row[c]);
      if (
        text === "họ và tên" ||
        text === "họ tên" ||
        text === "họ và tên học sinh" ||
        text === "tên học sinh" ||
        text === "họ tên học sinh" ||
        text === "fullname" ||
        text === "full name" ||
        text === "người học"
      ) {
        headerRowIndex = r;
        fullNameCol = c;
        break;
      }
      if (text === "họ" || text === "họ và tên đệm" || text === "họ lót" || text === "họ đệm") {
        headerRowIndex = r;
        lastNameCol = c;
      }
      if (text === "tên" || text === "tên gọi" || text === "firstname") {
        headerRowIndex = r;
        firstNameCol = c;
      }
    }
    if (fullNameCol !== -1 || (lastNameCol !== -1 && firstNameCol !== -1)) {
      break;
    }
  }

  const results: string[] = [];

  // Nếu tìm thấy cột "Họ và tên"
  if (fullNameCol !== -1 && headerRowIndex !== -1) {
    for (let r = headerRowIndex + 1; r < matrix.length; r++) {
      const val = matrix[r][fullNameCol];
      if (isValidStudentName(val)) {
        results.push(cleanName(val));
      }
    }
    if (results.length > 0) return results;
  }

  // Nếu tìm thấy cột riêng "Họ đệm" + "Tên"
  if (lastNameCol !== -1 && firstNameCol !== -1 && headerRowIndex !== -1) {
    for (let r = headerRowIndex + 1; r < matrix.length; r++) {
      const last = matrix[r][lastNameCol] || "";
      const first = matrix[r][firstNameCol] || "";
      const full = `${last} ${first}`.trim();
      if (isValidStudentName(full)) {
        results.push(cleanName(full));
      }
    }
    if (results.length > 0) return results;
  }

  // Nếu không tìm thấy header rõ ràng, quét tìm cột có nhiều tên người Việt nhất
  let bestCol = -1;
  let maxValidCount = 0;
  const maxCols = Math.max(...matrix.map((r) => r.length), 0);

  for (let c = 0; c < maxCols; c++) {
    let count = 0;
    for (let r = 0; r < matrix.length; r++) {
      const cell = matrix[r][c] || "";
      if (looksLikeVietnameseName(cell)) {
        count++;
      }
    }
    if (count > maxValidCount) {
      maxValidCount = count;
      bestCol = c;
    }
  }

  if (bestCol !== -1 && maxValidCount >= 2) {
    for (let r = 0; r < matrix.length; r++) {
      const val = matrix[r][bestCol] || "";
      if (looksLikeVietnameseName(val)) {
        results.push(cleanName(val));
      }
    }
    if (results.length > 0) return results;
  }

  return results;
}

function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

function isValidStudentName(name?: string): boolean {
  if (!name) return false;
  const cleaned = cleanName(name);
  if (cleaned.length < 3 || cleaned.length > 50) return false;
  // Bỏ qua nếu chỉ toàn số, ngày tháng hoặc tiêu đề
  if (/^[0-9\/\-.,\s]+$/.test(cleaned)) return false;
  if (/^(stt|số thứ tự|họ và tên|họ tên|ghi chú|tổng số|nam|nữ|ngày sinh)$/i.test(cleaned)) return false;
  // Tên người thường có ít nhất 2 từ
  return cleaned.includes(" ");
}

const COMMON_VN_SURNAMES = new Set([
  "nguyễn", "trần", "lê", "phạm", "hoàng", "huỳnh", "phan", "vũ", "võ", "đặng", "bùi", "đỗ", "hồ", "ngô", "dương", "lý", "đào", "đinh", "đoàn"
]);

function looksLikeVietnameseName(text: string): boolean {
  if (!isValidStudentName(text)) return false;
  const firstWord = text.split(" ")[0].toLowerCase();
  return COMMON_VN_SURNAMES.has(firstWord);
}
