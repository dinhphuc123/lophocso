"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  FileText, 
  Download, 
  Copy, 
  Cpu, 
  Layers, 
  GraduationCap,
  Printer
} from "lucide-react";

interface LessonPlanData {
  title: string;
  grade: string;
  duration: string;
  model: string;
  nlsFocus: string;
  objectives: {
    knowledge: string[];
    mathCompetence: string[];
    digitalCompetence: string[];
    qualities: string[];
  };
  tools: string[];
  activities: {
    name: string;
    target: string;
    content: string;
    product: string;
    execution: string;
  }[];
  rubric: {
    criteria: string;
    level1: string;
    level2: string;
    level3: string;
  }[];
}

const PRESET_PLANS: Record<string, LessonPlanData> = {
  "dao-ham": {
    title: "Ứng dụng Đạo hàm khảo sát & vẽ đồ thị hàm số",
    grade: "Lớp 12",
    duration: "2 tiết (90 phút)",
    model: "Mô hình 4 Trạm chuẩn CV 5512 kết hợp GeoGebra",
    nlsFocus: "Mô phỏng đồ thị hàm số số hóa, khai thác AI trợ giảng phân tích tiệm cận",
    objectives: {
      knowledge: [
        "Xét tính đơn điệu, cực trị, giá trị lớn nhất - nhỏ nhất và tiệm cận của hàm số bậc ba, phân thức hữu tỉ.",
        "Mô hình hóa bài toán thực tế tối ưu hóa chi phí sản xuất và dung tích hình học.",
      ],
      mathCompetence: [
        "Năng lực tư duy và lập luận toán học: Biện luận số nghiệm phương trình bằng sự tương giao đồ thị.",
        "Năng lực mô hình hóa toán học: Thiết lập hàm số mục tiêu từ tình huống kinh tế - kỹ thuật thực tiễn.",
      ],
      digitalCompetence: [
        "Khai thác phần mềm GeoGebra/Desmos để trực quan hóa sự biến thiên và tiếp tuyến tại một điểm.",
        "Ứng dụng Khảo Thí Số để làm bài kiểm tra nhanh 5 phút đầu giờ và tổng kết cuối tiết.",
      ],
      qualities: [
        "Chăm chỉ, trách nhiệm trong hoạt động nhóm, tính trung thực trong thu thập dữ liệu số.",
      ],
    },
    tools: [
      "Máy chiếu, máy tính kết nối Internet, ứng dụng Khảo Thí Số (khaothiso.vn)",
      "File GeoGebra động minh họa tiếp tuyến và đạo hàm",
      "Phiếu học tập số hóa (Google Docs / KWLH) và bảng phụ nhóm",
    ],
    activities: [
      {
        name: "Hoạt động 1: Mở đầu / Khởi động (7 phút)",
        target: "Tạo hứng thú, kích hoạt kiến thức về chiều biến thiên và cực trị qua bài toán thực tế.",
        content: "Học sinh tham gia Game trắc nghiệm nhanh trên điện thoại qua mã PIN phòng Khảo Thí Số (5 câu hỏi).",
        product: "Bảng xếp hạng điểm số trực tiếp trên màn hình chiếu của giáo viên.",
        execution: "GV chiếu QR Code phòng game; HS quét mã tham gia; GV nhận xét nhanh điểm mạnh và lỗ hổng kiến thức.",
      },
      {
        name: "Hoạt động 2: Hình thành kiến thức mới (30 phút)",
        target: "Nắm vững sơ đồ 4 bước khảo sát hàm số và cách xác định các đường tiệm cận đứng, ngang, xiên.",
        content: "Nhiệm vụ trạm: Nhóm 1-2 khảo sát hàm đa thức; Nhóm 3-4 khảo sát hàm phân thức trên GeoGebra.",
        product: "Bảng khảo sát hoàn chỉnh và đường cong đồ thị được vẽ trên ứng dụng số.",
        execution: "Chuyển giao nhiệm vụ -> HS thực hiện theo nhóm -> Đại diện nhóm chiếu màn hình GeoGebra thuyết minh -> GV chuẩn hóa kiến thức.",
      },
      {
        name: "Hoạt động 3: Luyện tập (35 phút)",
        target: "Rèn luyện kỹ năng giải nhanh các dạng bài nhận dạng đồ thị và tìm tham số m để hàm số đơn điệu.",
        content: "HS giải phiếu bài tập mức độ Thông hiểu và Vận dụng trên giấy kết hợp nhập đáp án vào Khảo Thí Số.",
        product: "Bài giải chi tiết của HS và thống kê phân tích câu sai trên hệ thống.",
        execution: "HS làm việc cá nhân -> Thảo luận cặp đôi -> GV chấm bài bằng camera quét phiếu OMR nhanh.",
      },
      {
        name: "Hoạt động 4: Vận dụng & Mở rộng (18 phút)",
        target: "Vận dụng tối ưu hóa đạo hàm vào thiết kế hộp chứa hàng tiết kiệm nguyên liệu nhất.",
        content: "Bài toán thực tế: 'Thiết kế vỏ lon nước ngọt hình trụ dung tích 330ml sao cho diện tích toàn phần nhỏ nhất'.",
        product: "Mô hình toán học, phương trình đạo hàm tìm bán kính R tối ưu và bài thuyết trình ngắn.",
        execution: "GV đặt câu hỏi Driving Question -> Nhóm thảo luận và dùng máy tính Casio/GeoGebra tìm cực trị -> Báo cáo kết quả.",
      },
    ],
    rubric: [
      {
        criteria: "Khai thác công cụ số (GeoGebra / Khảo Thí Số)",
        level1: "Chưa thao tác được phần mềm, phụ thuộc thành viên khác.",
        level2: "Nhập được hàm số, vẽ được đồ thị nhưng chưa tinh chỉnh tham số.",
        level3: "Thành thạo nhập hàm, trượt thanh Slider tham số m và kết luận chính xác sự biến thiên.",
      },
      {
        criteria: "Mô hình hóa toán học bài toán tối ưu",
        level1: "Chưa biểu diễn được đại lượng cần tối ưu theo một biến.",
        level2: "Lập được hàm số f(x) nhưng còn sai sót khi tính đạo hàm hoặc tìm điều kiện biến.",
        level3: "Thiết lập chính xác hàm mục tiêu, khảo sát đạo hàm chuẩn xác và giải thích ý nghĩa thực tiễn.",
      },
    ],
  },
  "oxyz": {
    title: "Vectơ và hệ trục tọa độ trong không gian Oxyz",
    grade: "Lớp 12",
    duration: "2 tiết (90 phút)",
    model: "STEM / Driving Question",
    nlsFocus: "Mô hình hóa 3D không gian vũ trụ và định vị vệ tinh GPS",
    objectives: {
      knowledge: [
        "Xác định tọa độ điểm, vectơ trong không gian Oxyz; tính độ dài, tích vô hướng và góc giữa hai vectơ.",
        "Mô tả vị trí máy bay hoặc vệ tinh viễn thông bằng tọa độ ba chiều.",
      ],
      mathCompetence: [
        "Năng lực tưởng tượng không gian và tư duy hình học giải tích ba chiều.",
        "Năng lực giải quyết vấn đề toán học liên môn Vật lý và Khoa học vũ trụ.",
      ],
      digitalCompetence: [
        "Sử dụng phần mềm GeoGebra 3D để xoay và quan sát các mặt phẳng tọa độ.",
        "Tra cứu dữ liệu độ cao vệ tinh và ứng dụng bản đồ số vệ tinh.",
      ],
      qualities: [
        "Tò mò khoa học, say mê khám phá công nghệ hàng không vũ trụ.",
      ],
    },
    tools: [
      "Phần mềm GeoGebra 3D Calculator trên Tablet / Laptop học sinh",
      "Mô hình khung 3 trục tọa độ vuông góc vật lý Oxyz",
      "Slide tương tác và bảng kiểm tra trực tuyến trên Khảo Thí Số",
    ],
    activities: [
      {
        name: "Hoạt động 1: Khởi động (10 phút)",
        target: "Đặt vấn đề: 'Làm thế nào trạm kiểm soát không lưu biết chính xác vị trí máy bay trên bầu trời?'",
        content: "Xem video mô phỏng hệ thống định vị GPS và radar hàng không.",
        product: "Câu trả lời của HS: Cần 3 thông số (kinh độ, vĩ độ, độ cao) tương ứng với x, y, z.",
        execution: "GV trình chiếu video -> Đặt câu hỏi kích thích tư duy -> Dẫn dắt vào hệ trục tọa độ Oxyz.",
      },
      {
        name: "Hoạt động 2: Hình thành kiến thức (35 phút)",
        target: "Xây dựng định nghĩa hệ trục Oxyz, tọa độ điểm và tọa độ vectơ.",
        content: "HS thực hành xác định tọa độ các đỉnh của hình hộp chữ nhật trên phần mềm 3D.",
        product: "Tọa độ 8 đỉnh và các công thức độ dài vectơ, tích vô hướng trong không gian.",
        execution: "GV hướng dẫn các trục Ox, Oy, Oz đôi một vuông góc -> HS thực hành trên GeoGebra 3D -> Ghi chép định lý.",
      },
      {
        name: "Hoạt động 3: Luyện tập (30 phút)",
        target: "Tính toán khoảng cách, độ dài đoạn thẳng và kiểm tra tính vuông góc của hai vectơ.",
        content: "Giải bài tập trắc nghiệm đúng/sai và trả lời ngắn chuẩn cấu trúc Bộ GD&ĐT 2025.",
        product: "Kết quả bài làm trên hệ thống Khảo Thí Số với phản hồi tức thì.",
        execution: "HS làm bài độc lập -> Hệ thống phân tích tỷ lệ đúng/sai -> GV sửa lỗi câu sai nhiều nhất.",
      },
      {
        name: "Hoạt động 4: Vận dụng (15 phút)",
        target: "Tính góc phát sóng giữa 2 vệ tinh viễn thông đến một trạm thu mặt đất.",
        content: "Cho tọa độ trạm thu S và 2 vệ tinh A, B; tính cos góc ASB bằng công thức tích vô hướng.",
        product: "Góc cần tìm làm tròn đến phút và nhận xét vùng phủ sóng.",
        execution: "HS làm việc theo cặp -> Nộp kết quả lên bảng Padlet/LMS -> GV đánh giá.",
      },
    ],
    rubric: [
      {
        criteria: "Thao tác không gian 3D số hóa",
        level1: "Chưa định vị được các trục tọa độ trong không gian 3 chiều.",
        level2: "Vẽ được điểm trong Oxyz trên GeoGebra nhưng chưa xoay chuyển góc nhìn tối ưu.",
        level3: "Thành thạo dựng hình 3D, đo khoảng cách và góc chính xác trên phần mềm.",
      },
    ],
  },
  "bayes": {
    title: "Xác suất có điều kiện và Công thức Bayes",
    grade: "Lớp 12",
    duration: "2 tiết (90 phút)",
    model: "Flipped Classroom + KWLH",
    nlsFocus: "Mô phỏng cây xác suất số, phân tích độ nhạy xét nghiệm y tế & Machine Learning",
    objectives: {
      knowledge: [
        "Hiểu và vận dụng công thức xác suất toàn phần và công thức Bayes vào bài toán thực tiễn.",
        "Phân biệt giữa P(A|B) và P(B|A) để tránh ngụy biện xác suất.",
      ],
      mathCompetence: [
        "Năng lực tư duy xác suất thống kê và xử lý rủi ro trong y khoa, kinh tế.",
      ],
      digitalCompetence: [
        "Dùng bảng tính Google Sheets / Excel để tự động hóa bảng phân bố xác suất Bayes.",
        "Hiểu nguyên lý cơ bản của bộ lọc thư rác (Spam Filter Naive Bayes).",
      ],
      qualities: [
        "Tư duy phản biện, cảnh giác với thông tin sai lệch trên không gian mạng.",
      ],
    },
    tools: [
      "Video học liệu số giao trước ở nhà trên K12 / Google Classroom",
      "Phiếu KWLH điện tử (What I Know, What I Want to know, What I Learned, How to apply)",
      "App Khảo Thí Số phòng game đối kháng 'Đấu trường RPG' để ôn tập công thức",
    ],
    activities: [
      {
        name: "Hoạt động 1: Kiểm tra chuẩn bị bài ở nhà (8 phút)",
        target: "Đánh giá việc tự học video bài giảng Flipped Classroom ở nhà của học sinh.",
        content: "Minigame Đấu trường RPG 6 câu hỏi về công thức nhân xác suất và cây xác suất.",
        product: "Điểm số và huy hiệu thành tích của học sinh.",
        execution: "HS vào game bằng mã PIN -> Đấu trí theo tổ -> GV khen thưởng tổ dẫn đầu.",
      },
      {
        name: "Hoạt động 2: Hình thành kiến thức (32 phút)",
        target: "Thiết lập công thức xác suất toàn phần và công thức Bayes qua bài toán xét nghiệm bệnh hiếm.",
        content: "Thảo luận: Một bệnh có tỷ lệ mắc 0.1%. Xét nghiệm chính xác 99%. Người có kết quả dương tính thì xác suất thực sự mắc bệnh là bao nhiêu?",
        product: "Sơ đồ cây xác suất chi tiết và kết quả bất ngờ: P(Bệnh|Dương tính) chỉ khoảng ~9%.",
        execution: "HS dự đoán trực giác (thường đoán 99%) -> Tính toán chính xác bằng Bayes -> Giải mã ngụy biện y khoa.",
      },
      {
        name: "Hoạt động 3: Luyện tập (35 phút)",
        target: "Rèn luyện bài tập tính xác suất toàn phần và Bayes trong kiểm tra chất lượng sản phẩm.",
        content: "Luyện tập theo nhóm 4 người (kỹ thuật Khăn trải bàn).",
        product: "Giấy A0 ghi lời giải của 4 thành viên và đáp án thống nhất ở trung tâm.",
        execution: "HS làm việc độc lập 5 phút -> Thảo luận nhóm 10 phút -> Treo sản phẩm quanh lớp (Gallery Walk).",
      },
      {
        name: "Hoạt động 4: Vận dụng (15 phút)",
        target: "Ứng dụng Bayes trong trí tuệ nhân tạo: Bộ lọc email thư rác (Naive Bayes Classifier).",
        content: "Mô phỏng máy tính tính xác suất một bức thư chứa từ khóa 'Khuyến mãi khủng' có phải là Spam hay không.",
        product: "Thuật toán đơn giản viết bằng lời giải thích cách email tự phân loại vào hòm thư rác.",
        execution: "GV liên hệ thực tế NLS -> HS thảo luận về an toàn thông tin số.",
      },
    ],
    rubric: [
      {
        criteria: "Hiểu bản chất và vận dụng công thức Bayes",
        level1: "Nhầm lẫn giữa P(A|B) và P(B|A).",
        level2: "Áp dụng được công thức khi có sẵn số liệu nhưng chưa vẽ được cây xác suất.",
        level3: "Vẽ thành thạo cây xác suất, giải thích rõ ràng nghịch lý dương tính giả trong y tế.",
      },
    ],
  },
};

export default function TeacherLessonPlansPage() {
  const [selectedKey, setSelectedKey] = useState<string>("dao-ham");
  const [activeTab, setActiveTab] = useState<"plan" | "rubric" | "prompt">("plan");
  const [copied, setCopied] = useState(false);

  const plan = PRESET_PLANS[selectedKey] || PRESET_PLANS["dao-ham"];

  // Generate Word Document Blob
  const exportToWord = () => {
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${plan.title}</title>
        <style>
          body { font-family: "Times New Roman", serif; font-size: 13pt; line-height: 1.3; }
          h1 { font-size: 16pt; text-align: center; text-transform: uppercase; margin-bottom: 5px; }
          h2 { font-size: 14pt; color: #1e3a8a; margin-top: 15px; }
          h3 { font-size: 13pt; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
          th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; font-size: 12pt; }
          th { background-color: #f1f5f9; text-align: center; }
          .header-box { text-align: center; font-weight: bold; margin-bottom: 15px; }
          .badge { color: #0284c7; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-box">
          TRƯỜNG THPT ................................................<br/>
          TỔ TOÁN - TIN HỌC<br/>
          ------------------------
        </div>
        <h1>KẾ HOẠCH BÀI DẠY (GIÁO ÁN) CHUẨN CÔNG VĂN 5512</h1>
        <p style="text-align: center; font-style: italic;">
          (Tích hợp Thông tư 02/2025/TT-BGDĐT về Năng lực số & Khung năng lực AI)
        </p>

        <p><b>TÊN BÀI DẠY:</b> ${plan.title.toUpperCase()}</p>
        <p><b>Môn học/Hoạt động giáo dục:</b> Toán học; <b>Lớp:</b> ${plan.grade}</p>
        <p><b>Thời lượng thực hiện:</b> ${plan.duration}</p>
        <p><b>Mô hình sư phạm:</b> ${plan.model}</p>
        <p><b>Trọng tâm Năng lực số (NLS):</b> ${plan.nlsFocus}</p>

        <h2>I. MỤC TIÊU BÀI DẠY</h2>
        <h3>1. Về kiến thức:</h3>
        <ul>
          ${plan.objectives.knowledge.map((k) => `<li>${k}</li>`).join("")}
        </ul>

        <h3>2. Về năng lực:</h3>
        <p><b>- Năng lực toán học:</b></p>
        <ul>
          ${plan.objectives.mathCompetence.map((m) => `<li>${m}</li>`).join("")}
        </ul>
        <p><b>- Năng lực số (NLS) theo Thông tư 02/2025:</b></p>
        <ul>
          ${plan.objectives.digitalCompetence.map((d) => `<li>${d}</li>`).join("")}
        </ul>

        <h3>3. Về phẩm chất:</h3>
        <ul>
          ${plan.objectives.qualities.map((q) => `<li>${q}</li>`).join("")}
        </ul>

        <h2>II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU SỐ</h2>
        <ul>
          ${plan.tools.map((t) => `<li>${t}</li>`).join("")}
        </ul>

        <h2>III. TIẾN TRÌNH DẠY HỌC (4 HOẠT ĐỘNG CHUẨN CV 5512)</h2>
        ${plan.activities
          .map(
            (act) => `
          <table border="1">
            <tr>
              <th colspan="2" style="background-color: #e2e8f0; text-align: left; font-weight: bold;">
                ${act.name.toUpperCase()}
              </th>
            </tr>
            <tr>
              <td style="width: 25%; font-weight: bold;">a) Mục tiêu:</td>
              <td>${act.target}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">b) Nội dung:</td>
              <td>${act.content}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">c) Sản phẩm:</td>
              <td>${act.product}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">d) Tổ chức thực hiện:</td>
              <td>${act.execution}</td>
            </tr>
          </table>
        `
          )
          .join("")}

        <h2>IV. BẢNG TIÊU CHÍ ĐÁNH GIÁ (RUBRIC NĂNG LỰC SỐ)</h2>
        <table border="1">
          <tr>
            <th style="width: 25%;">Tiêu chí</th>
            <th>Mức 1 (Chưa đạt)</th>
            <th>Mức 2 (Đạt)</th>
            <th>Mức 3 (Tốt)</th>
          </tr>
          ${plan.rubric
            .map(
              (r) => `
            <tr>
              <td><b>${r.criteria}</b></td>
              <td>${r.level1}</td>
              <td>${r.level2}</td>
              <td>${r.level3}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", htmlContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Giao_an_5512_NLS_${plan.grade}_${selectedKey}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyMarkdown = () => {
    const text = `# KẾ HOẠCH BÀI DẠY: ${plan.title.toUpperCase()}
Chuẩn Công văn 5512/BGDĐT & Tích hợp Năng lực số (TT 02/2025/TT-BGDĐT)

- Lớp: ${plan.grade} | Thời lượng: ${plan.duration}
- Mô hình: ${plan.model}
- Trọng tâm NLS: ${plan.nlsFocus}

## I. MỤC TIÊU BÀI DẠY
1. Kiến thức:
${plan.objectives.knowledge.map((k) => `  - ${k}`).join("\n")}

2. Năng lực:
  * Năng lực toán học:
${plan.objectives.mathCompetence.map((m) => `    + ${m}`).join("\n")}
  * Năng lực số (NLS):
${plan.objectives.digitalCompetence.map((d) => `    + ${d}`).join("\n")}

3. Phẩm chất:
${plan.objectives.qualities.map((q) => `  - ${q}`).join("\n")}

## II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU SỐ
${plan.tools.map((t) => `- ${t}`).join("\n")}

## III. TIẾN TRÌNH DẠY HỌC (4 HOẠT ĐỘNG)
${plan.activities
  .map(
    (act) => `### ${act.name}
- Mục tiêu: ${act.target}
- Nội dung: ${act.content}
- Sản phẩm: ${act.product}
- Tổ chức thực hiện: ${act.execution}
`
  )
  .join("\n")}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <span>Kế hoạch Bài dạy Tích hợp Năng lực số (NLS)</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Chuẩn hóa Công văn 5512/BGDĐT, tích hợp Thông tư 02/2025/TT-BGDĐT và khung năng lực AI GDPT 2018.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyMarkdown}
              className="px-3 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4 text-muted-foreground" />
              <span>{copied ? "Đã chép!" : "Sao chép"}</span>
            </button>
            <button
              onClick={exportToWord}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Xuất bản Word (.doc)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(PRESET_PLANS).map(([key, item]) => (
          <button
            key={key}
            onClick={() => setSelectedKey(key)}
            className={`p-4 rounded-2xl border text-left transition space-y-1.5 cursor-pointer ${
              selectedKey === key
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs"
                : "border-border bg-card hover:border-border/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {item.grade}
              </span>
              {selectedKey === key && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
            </div>
            <h3 className="font-bold text-xs text-foreground line-clamp-1">{item.title}</h3>
            <p className="text-[11px] text-muted-foreground line-clamp-1">{item.model}</p>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex items-center gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("plan")}
          className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "plan"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kế hoạch 4 Hoạt động (CV 5512)</span>
        </button>
        <button
          onClick={() => setActiveTab("rubric")}
          className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "rubric"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Rubric Đánh giá Năng lực số</span>
        </button>
        <button
          onClick={() => setActiveTab("prompt")}
          className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "prompt"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Prompt AI Gợi ý cho Học sinh</span>
        </button>
      </div>

      {/* Tab 1: Detailed 5512 Plan */}
      {activeTab === "plan" && (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600">
                {plan.grade}
              </span>
              <span className="text-xs text-muted-foreground">• Thời lượng: {plan.duration}</span>
              <span className="text-xs text-muted-foreground">• Mô hình: {plan.model}</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-foreground">{plan.title}</h2>
            <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs flex items-center gap-2 text-foreground">
              <Cpu className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><b>Trọng tâm NLS:</b> {plan.nlsFocus}</span>
            </div>
          </div>

          {/* I. Objectives */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>I. Mục tiêu bài dạy</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-foreground">1. Về kiến thức:</div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                {plan.objectives.knowledge.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-foreground">2. Về năng lực:</div>
              <div className="pl-2 space-y-2">
                <div>
                  <span className="font-semibold text-foreground">• Năng lực toán học:</span>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2 mt-0.5">
                    {plan.objectives.mathCompetence.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    • Năng lực số (TT 02/2025/TT-BGDĐT):
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2 mt-0.5">
                    {plan.objectives.digitalCompetence.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-foreground">3. Về phẩm chất:</div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                {plan.objectives.qualities.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* II. Equipment */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>II. Thiết bị dạy học và học liệu số</span>
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground pl-2">
              {plan.tools.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>

          {/* III. 4 Activities */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>III. Tiến trình dạy học (4 Hoạt động chuẩn CV 5512)</span>
            </h3>

            {plan.activities.map((act, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <h4 className="font-bold text-sm text-foreground">{act.name}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                    <span className="font-bold text-foreground">a) Mục tiêu:</span>
                    <p className="text-muted-foreground">{act.target}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                    <span className="font-bold text-foreground">b) Nội dung:</span>
                    <p className="text-muted-foreground">{act.content}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                    <span className="font-bold text-foreground">c) Sản phẩm:</span>
                    <p className="text-muted-foreground">{act.product}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                    <span className="font-bold text-foreground">d) Tổ chức thực hiện:</span>
                    <p className="text-muted-foreground">{act.execution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Rubric */}
      {activeTab === "rubric" && (
        <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
          <div>
            <h3 className="font-bold text-base text-foreground">Bảng Tiêu chí Đánh giá Năng lực số (Rubric)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Đánh giá mức độ thành thạo công nghệ và khai thác học liệu số của học sinh trong bài học.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-border rounded-xl overflow-hidden">
              <thead className="bg-muted text-foreground uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3 border-b border-border w-1/4">Tiêu chí</th>
                  <th className="p-3 border-b border-border w-1/4 text-rose-600">Mức 1 (Chưa đạt)</th>
                  <th className="p-3 border-b border-border w-1/4 text-amber-600">Mức 2 (Đạt)</th>
                  <th className="p-3 border-b border-border w-1/4 text-emerald-600">Mức 3 (Tốt)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {plan.rubric.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="p-3 font-bold text-foreground align-top">{r.criteria}</td>
                    <td className="p-3 text-muted-foreground align-top">{r.level1}</td>
                    <td className="p-3 text-muted-foreground align-top">{r.level2}</td>
                    <td className="p-3 text-muted-foreground align-top font-medium text-foreground">{r.level3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: AI Prompts for Students */}
      {activeTab === "prompt" && (
        <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
          <div>
            <h3 className="font-bold text-base text-foreground">Prompt AI Hướng dẫn Học sinh (Đạo đức AI & NLS)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Các mẫu lệnh giáo viên hướng dẫn học sinh hỏi trợ lý AI an toàn, chống chép lời giải máy móc.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Prompt 1: Gợi ý phương pháp giải thay vì đưa đáp án</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">Tư duy phản biện</span>
              </div>
              <p className="text-xs font-mono bg-background p-3 rounded-lg border border-border text-foreground">
                &quot;Em đang học bài {plan.title}. Hãy đóng vai gia sư Toán kiên nhẫn: Khi em gửi một bài toán, đừng giải ngay đáp số mà hãy đặt 2 câu hỏi gợi ý để em tự tìm ra hướng giải quyết!&quot;
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Prompt 2: Tạo dữ liệu mô phỏng trên GeoGebra</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">Mô hình hóa số</span>
              </div>
              <p className="text-xs font-mono bg-background p-3 rounded-lg border border-border text-foreground">
                &quot;Hãy hướng dẫn em các bước tạo thanh trượt Slider tham số m trong GeoGebra để quan sát sự chuyển động của các điểm cực trị bài toán này.&quot;
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
