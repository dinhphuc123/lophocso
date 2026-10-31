import { Exam, Question } from "./types";

export interface LevelCount {
  nb: number;
  th: number;
  vd: number;
  vdc: number;
  total: number;
}

export interface LevelPoints {
  nb: number;
  th: number;
  vd: number;
  vdc: number;
  total: number;
}

export interface MatrixRow {
  partTitle: string;
  formatName: string;
  questionCount: LevelCount;
  points: LevelPoints;
}

export interface SpecificationItem {
  id: string;
  index: number;
  part: string;
  format: string;
  topic: string;
  level: "NB" | "TH" | "VD" | "VDC";
  competency: string; // Yêu cầu cần đạt
  points: number;
}

export interface ExamMatrixResult {
  exam: Exam;
  rows: MatrixRow[];
  totalQuestions: LevelCount;
  totalPoints: LevelPoints;
  percentage: {
    nb: number;
    th: number;
    vd: number;
    vdc: number;
  };
  specifications: SpecificationItem[];
}

export function calculateExamMatrix(exam: Exam): ExamMatrixResult {
  const mc: Question[] = [];
  const tf: Question[] = [];
  const sa: Question[] = [];
  const es: Question[] = [];

  exam.questions.forEach((q) => {
    if (q.type === "multiple_choice") mc.push(q);
    else if (q.type === "true_false") tf.push(q);
    else if (q.type === "short_answer") sa.push(q);
    else if (q.type === "essay") es.push(q);
  });

  // 1. Part I - Multiple Choice (0.25 pts/question)
  const mcCount: LevelCount = { nb: 0, th: 0, vd: 0, vdc: 0, total: mc.length };
  mc.forEach((q) => {
    const lvl = (q.level?.toUpperCase() || "NB") as "NB" | "TH" | "VD" | "VDC";
    if (lvl === "NB") mcCount.nb++;
    else if (lvl === "TH") mcCount.th++;
    else if (lvl === "VD") mcCount.vd++;
    else if (lvl === "VDC") mcCount.vdc++;
    else mcCount.nb++;
  });
  const mcPoints: LevelPoints = {
    nb: +(mcCount.nb * 0.25).toFixed(2),
    th: +(mcCount.th * 0.25).toFixed(2),
    vd: +(mcCount.vd * 0.25).toFixed(2),
    vdc: +(mcCount.vdc * 0.25).toFixed(2),
    total: +(mcCount.total * 0.25).toFixed(2),
  };

  // 2. Part II - True / False (4 subquestions = 1.0 pt, each subquestion has its own level)
  const tfCount: LevelCount = { nb: 0, th: 0, vd: 0, vdc: 0, total: 0 };
  tf.forEach((q) => {
    if (q.type === "true_false") {
      q.subQuestions.forEach((sub) => {
        tfCount.total++;
        const lvl = (sub.level?.toUpperCase() || q.level?.toUpperCase() || "TH") as "NB" | "TH" | "VD" | "VDC";
        if (lvl === "NB") tfCount.nb++;
        else if (lvl === "TH") tfCount.th++;
        else if (lvl === "VD") tfCount.vd++;
        else if (lvl === "VDC") tfCount.vdc++;
        else tfCount.th++;
      });
    }
  });
  // In CV 7991, 1 question = 1.0 point, 4 questions = 4.0 points total
  const tfTotalPoints = +(tf.length * 1.0).toFixed(2);
  const tfPtsPerSub = tfCount.total > 0 ? tfTotalPoints / tfCount.total : 0.25;
  const tfPoints: LevelPoints = {
    nb: +(tfCount.nb * tfPtsPerSub).toFixed(2),
    th: +(tfCount.th * tfPtsPerSub).toFixed(2),
    vd: +(tfCount.vd * tfPtsPerSub).toFixed(2),
    vdc: +(tfCount.vdc * tfPtsPerSub).toFixed(2),
    total: tfTotalPoints,
  };

  // 3. Part III - Short Answer (0.5 pts/question)
  const saCount: LevelCount = { nb: 0, th: 0, vd: 0, vdc: 0, total: sa.length };
  sa.forEach((q) => {
    const lvl = (q.level?.toUpperCase() || "VD") as "NB" | "TH" | "VD" | "VDC";
    if (lvl === "NB") saCount.nb++;
    else if (lvl === "TH") saCount.th++;
    else if (lvl === "VD") saCount.vd++;
    else if (lvl === "VDC") saCount.vdc++;
    else saCount.vd++;
  });
  const saPoints: LevelPoints = {
    nb: +(saCount.nb * 0.5).toFixed(2),
    th: +(saCount.th * 0.5).toFixed(2),
    vd: +(saCount.vd * 0.5).toFixed(2),
    vdc: +(saCount.vdc * 0.5).toFixed(2),
    total: +(saCount.total * 0.5).toFixed(2),
  };

  // 4. Part IV - Essay (if present)
  const esCount: LevelCount = { nb: 0, th: 0, vd: 0, vdc: 0, total: es.length };
  let esTotalPoints = 0;
  es.forEach((q) => {
    const lvl = (q.level?.toUpperCase() || "VD") as "NB" | "TH" | "VD" | "VDC";
    if (lvl === "NB") esCount.nb++;
    else if (lvl === "TH") esCount.th++;
    else if (lvl === "VD") esCount.vd++;
    else if (lvl === "VDC") esCount.vdc++;
    else esCount.vd++;
    esTotalPoints += q.points || 1.0;
  });
  const esPtsPerQ = esCount.total > 0 ? esTotalPoints / esCount.total : 1.0;
  const esPoints: LevelPoints = {
    nb: +(esCount.nb * esPtsPerQ).toFixed(2),
    th: +(esCount.th * esPtsPerQ).toFixed(2),
    vd: +(esCount.vd * esPtsPerQ).toFixed(2),
    vdc: +(esCount.vdc * esPtsPerQ).toFixed(2),
    total: +esTotalPoints.toFixed(2),
  };

  const rows: MatrixRow[] = [
    {
      partTitle: "Phần I",
      formatName: "Trắc nghiệm nhiều lựa chọn (4 phương án chọn 1)",
      questionCount: mcCount,
      points: mcPoints,
    },
    {
      partTitle: "Phần II",
      formatName: "Trắc nghiệm Đúng / Sai (Mỗi câu gồm 4 lệnh hỏi a, b, c, d)",
      questionCount: tfCount,
      points: tfPoints,
    },
    {
      partTitle: "Phần III",
      formatName: "Trắc nghiệm trả lời ngắn (Điền số / kết quả)",
      questionCount: saCount,
      points: saPoints,
    },
  ];

  if (es.length > 0) {
    rows.push({
      partTitle: "Phần IV",
      formatName: "Tự luận",
      questionCount: esCount,
      points: esPoints,
    });
  }

  const totalQuestions: LevelCount = {
    nb: mcCount.nb + tfCount.nb + saCount.nb + esCount.nb,
    th: mcCount.th + tfCount.th + saCount.th + esCount.th,
    vd: mcCount.vd + tfCount.vd + saCount.vd + esCount.vd,
    vdc: mcCount.vdc + tfCount.vdc + saCount.vdc + esCount.vdc,
    total: mcCount.total + tfCount.total + saCount.total + esCount.total,
  };

  const totalPoints: LevelPoints = {
    nb: +(mcPoints.nb + tfPoints.nb + saPoints.nb + esPoints.nb).toFixed(2),
    th: +(mcPoints.th + tfPoints.th + saPoints.th + esPoints.th).toFixed(2),
    vd: +(mcPoints.vd + tfPoints.vd + saPoints.vd + esPoints.vd).toFixed(2),
    vdc: +(mcPoints.vdc + tfPoints.vdc + saPoints.vdc + esPoints.vdc).toFixed(2),
    total: +(mcPoints.total + tfPoints.total + saPoints.total + esPoints.total).toFixed(2),
  };

  const grandTotal = totalPoints.total || 10;
  const percentage = {
    nb: Math.round((totalPoints.nb / grandTotal) * 100),
    th: Math.round((totalPoints.th / grandTotal) * 100),
    vd: Math.round((totalPoints.vd / grandTotal) * 100),
    vdc: Math.round((totalPoints.vdc / grandTotal) * 100),
  };

  // Generate specification details
  const specifications: SpecificationItem[] = [];
  let specIndex = 1;

  exam.questions.forEach((q) => {
    let part = "Phần I";
    let format = "Trắc nghiệm nhiều lựa chọn";
    if (q.type === "true_false") {
      part = "Phần II";
      format = "Trắc nghiệm Đúng / Sai";
    } else if (q.type === "short_answer") {
      part = "Phần III";
      format = "Trả lời ngắn";
    } else if (q.type === "essay") {
      part = "Phần IV";
      format = "Tự luận";
    }

    // Infer topic / competency from text
    const textSnippet = q.text.replace(/\$[^$]+\$/g, "").replace(/\s+/g, " ").trim();
    let topic = "Hàm số & Đồ thị";
    if (/tích phân|nguyên hàm|hình phẳng|khối tròn xoay/i.test(textSnippet)) topic = "Nguyên hàm - Tích phân";
    else if (/hình hộp|khối chóp|lăng trụ|tọa độ|không gian|vector/i.test(textSnippet)) topic = "Hình học & Tọa độ Oxyz";
    else if (/xác suất|biến cố|thống kê|mẫu số liệu/i.test(textSnippet)) topic = "Xác suất & Thống kê";
    else if (/tiệm cận|đồng biến|nghịch biến|cực trị|giá trị lớn nhất/i.test(textSnippet)) topic = "Ứng dụng đạo hàm & Khảo sát hàm số";

    const lvl = (q.level?.toUpperCase() || "TH") as "NB" | "TH" | "VD" | "VDC";
    const competency = lvl === "NB"
      ? "Nhận biết các khái niệm, định lý và công thức cơ bản."
      : lvl === "TH"
      ? "Thông hiểu và tính toán trực tiếp với các số liệu/đồ thị đã cho."
      : lvl === "VD"
      ? "Vận dụng kiến thức giải quyết bài toán thực tế hoặc kết hợp nhiều bước suy luận."
      : "Vận dụng cao trong bài toán tối ưu và hình học mô hình phức hợp.";

    specifications.push({
      id: q.id,
      index: specIndex++,
      part,
      format,
      topic,
      level: lvl,
      competency,
      points: q.points || (q.type === "multiple_choice" ? 0.25 : q.type === "true_false" ? 1.0 : 0.5),
    });
  });

  return {
    exam,
    rows,
    totalQuestions,
    totalPoints,
    percentage,
    specifications,
  };
}
