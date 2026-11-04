import { Exam } from "./types";

export interface CyberGateStageMeta {
  stageNumber: number; // 1..5
  gateTitle: string;
  gateSubtitle: string;
  icon: string;
  thinkingPrompt: string;
  clueText: string;
  ruleCode: string;
  mentorPraise: string;
  svgType:
    | "cubic_graph"
    | "optimization_box"
    | "integral_area"
    | "velocity_rocket"
    | "asymptote_radar"
    | "oxyz_drone"
    | "plane_shield"
    | "laser_line"
    | "sphere_radar"
    | "angle_beam"
    | "parabola_bridge"
    | "trig_wave"
    | "sequence_tower"
    | "combinatorics_lock"
    | "probability_shield";
}

export interface CyberGatesPack {
  exam: Exam;
  packTag: string;
  packSummary: string;
  stages: CyberGateStageMeta[];
}

export const CYBER_GATES_PACKS: CyberGatesPack[] = [
  {
    packTag: "Chuyên đề 1 · Giải tích 12",
    packSummary: "Khảo sát đồ thị, Tối ưu thực tế, Tích phân diện tích, Vận tốc chuyển động & Tiệm cận Radar.",
    exam: {
      id: "preset-cyber-gates-giai-tich-12",
      code: "CG12A",
      title: "Mật Vụ Giải Tích 12: Giải Mã 5 Cánh Cổng Hàm Số & Tích Phân",
      subject: "Toán học",
      targetClass: "12",
      durationMinutes: 15,
      status: "open",
      createdAt: "2026-11-04T00:00:00.000Z",
      questions: [
        {
          id: "cg-gt-1",
          type: "multiple_choice",
          level: "TH",
          points: 2,
          text: "Cổng #1 (Rừng Đồ Thị Ảo Ảnh): Tín hiệu tường lửa biến thiên theo hàm số $y = x^3 - 3x + 2$. Điểm cực đại của đồ thị hàm số này có tọa độ là:",
          options: [
            { id: "A", text: "$(-1; 4)$" },
            { id: "B", text: "$(1; 0)$" },
            { id: "C", text: "$(-1; 0)$" },
            { id: "D", text: "$(1; 4)$" },
          ],
          correctAnswer: "A",
          explanation: "Ta có $y' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$. Tại $x = -1$, đạo hàm đổi dấu từ dương sang âm nên hàm số đạt cực đại tại $x = -1$, giá trị cực đại $y(-1) = (-1)^3 - 3(-1) + 2 = 4$. Vậy điểm cực đại là $(-1; 4)$.",
        },
        {
          id: "cg-gt-2",
          type: "multiple_choice",
          level: "VD",
          points: 2,
          text: "Cổng #2 (Hồ Tối Ưu Năng Lượng): Đội đặc nhiệm cần chế tạo hộp chứa lõi năng lượng không nắp từ tấm kim loại hình vuông cạnh $12\\text{ cm}$ bằng cách cắt 4 hình vuông nhỏ cạnh $x\\text{ cm}$ ở 4 góc rồi gập lên. Giá trị của $x$ để thể tích hộp đạt lớn nhất là:",
          options: [
            { id: "A", text: "$x = 3\\text{ cm}$" },
            { id: "B", text: "$x = 2\\text{ cm}$" },
            { id: "C", text: "$x = 4\\text{ cm}$" },
            { id: "D", text: "$x = 1,5\\text{ cm}$" },
          ],
          correctAnswer: "B",
          explanation: "Thể tích hộp là $V(x) = x(12 - 2x)^2$ với $0 < x < 6$. Đạo hàm $V'(x) = (12-2x)^2 - 4x(12-2x) = (12-2x)(12-6x)$. Cho $V'(x) = 0 \\Rightarrow x = 2\\text{ cm}$ (vì $x < 6$). Khi đó $V_{\\max} = 2 \\cdot 8^2 = 128\\text{ cm}^3$.",
        },
        {
          id: "cg-gt-3",
          type: "multiple_choice",
          level: "TH",
          points: 2,
          text: "Cổng #3 (Đảo Tích Phân Lá Chắn): Vùng an toàn của vòm chắn năng lượng giới hạn bởi parabol $y = 4 - x^2$ và trục hoành $Ox$. Diện tích mặt cắt vòm chắn này bằng:",
          options: [
            { id: "A", text: "$\\frac{16}{3}$" },
            { id: "B", text: "$\\frac{32}{3}$" },
            { id: "C", text: "$8$" },
            { id: "D", text: "$\\frac{64}{3}$" },
          ],
          correctAnswer: "B",
          explanation: "Phương trình hoành độ giao điểm: $4 - x^2 = 0 \\Leftrightarrow x = \\pm 2$. Diện tích $S = \\int_{-2}^{2} (4 - x^2)\\,dx = \\left.\\left(4x - \\frac{x^3}{3}\\right)\\right|_{-2}^{2} = \\frac{32}{3}$.",
        },
        {
          id: "cg-gt-4",
          type: "multiple_choice",
          level: "VD",
          points: 2,
          text: "Cổng #4 (Đỉnh Gia Tốc Phản Lực): Tàu thăm dò không gian mạng tăng tốc với vận tốc $v(t) = 3t^2 + 6t\\text{ (m/s)}$. Quãng đường tàu đi được từ giây thứ $t = 0$ đến $t = 2$ là:",
          options: [
            { id: "A", text: "$18\\text{ m}$" },
            { id: "B", text: "$24\\text{ m}$" },
            { id: "C", text: "$20\\text{ m}$" },
            { id: "D", text: "$12\\text{ m}$" },
          ],
          correctAnswer: "C",
          explanation: "Quãng đường $s = \\int_{0}^{2} (3t^2 + 6t)\\,dt = \\left.(t^3 + 3t^2)\\right|_{0}^{2} = 2^3 + 3 \\cdot 2^2 = 8 + 12 = 20\\text{ m}$.",
        },
        {
          id: "cg-gt-5",
          type: "multiple_choice",
          level: "TH",
          points: 2,
          text: "Cổng #5 (Hẻm Núi Tiệm Cận): Đường truyền tín hiệu vệ tinh có quỹ đạo $y = \\frac{2x + 1}{x - 1}$. Giao điểm hai đường tiệm cận đứng và tiệm cận ngang của quỹ đạo này có tọa độ là:",
          options: [
            { id: "A", text: "$I(1; 2)$" },
            { id: "B", text: "$I(2; 1)$" },
            { id: "C", text: "$I(-1; 2)$" },
            { id: "D", text: "$I(1; -1)$" },
          ],
          correctAnswer: "A",
          explanation: "Tiệm cận đứng là $x = 1$ (nghiệm mẫu số) và tiệm cận ngang là $y = 2$ (tỉ số hệ số bậc nhất). Giao điểm tâm đối xứng là $I(1; 2)$.",
        },
      ],
    },
    stages: [
      {
        stageNumber: 1,
        gateTitle: "Chặng 1: Rừng Đồ Thị Ảo Ảnh",
        gateSubtitle: "Giải mã điểm cực đại sóng hàm bậc 3",
        icon: "🌲",
        thinkingPrompt: "Quan sát nhánh bên trái của đường cong bậc ba với hệ số a > 0: Đỉnh nhô lên cao nhất nằm ở hoành độ âm hay dương?",
        clueText: "Tính đạo hàm y' = 3x² - 3 = 0 để tìm hai nghiệm x = -1 và x = 1. Với a = 1 > 0, điểm cực đại nằm bên trái (x = -1), sau đó thay x = -1 vào hàm số y.",
        ruleCode: "Quy tắc #1: Đạo hàm đổi dấu (+) sang (-) là Cực Đại",
        mentorPraise: "Tuyệt vời! Các Mật vụ đã bắt trúng đỉnh sóng cực đại (-1; 4) ngay từ cái nhìn đầu tiên!",
        svgType: "cubic_graph",
      },
      {
        stageNumber: 2,
        gateTitle: "Chặng 2: Hồ Tối Ưu Năng Lượng",
        gateSubtitle: "Cắt góc tấm kim loại tối đa thể tích",
        icon: "💧",
        thinkingPrompt: "Khi cắt 4 góc mỗi bên một đoạn x, đáy hộp hình vuông còn lại có độ dài cạnh là bao nhiêu?",
        clueText: "Cạnh đáy hộp còn lại là (12 - 2x), chiều cao hộp là x. Với bài toán cắt 4 góc hình vuông cạnh a, thể tích luôn đạt cực đại tại x = a / 6 = 12 / 6!",
        ruleCode: "Quy tắc #2: Cắt góc hình vuông cạnh a tối ưu tại x = a/6",
        mentorPraise: "Xuất sắc! Nhờ công thức đạo hàm tối ưu, lõi năng lượng đã đạt thể tích cực đại 128 cm³!",
        svgType: "optimization_box",
      },
      {
        stageNumber: 3,
        gateTitle: "Chặng 3: Đảo Tích Phân Lá Chắn",
        gateSubtitle: "Tính diện tích vòm chắn Parabol",
        icon: "🏝️",
        thinkingPrompt: "Vòm parabol y = 4 - x² cắt trục hoành tại hai chân vòm có hoành độ bằng bao nhiêu?",
        clueText: "Chân vòm là nghiệm của 4 - x² = 0 => x = -2 và x = 2. Áp dụng tích phân từ -2 đến 2 hoặc công thức nhanh diện tích vòm Parabol: S = (4/3) * đáy * chiều cao / 2.",
        ruleCode: "Quy tắc #3: Diện tích phẳng S = ∫|f(x)|dx giữa hai cận giao điểm",
        mentorPraise: "Chuẩn xác từng milimet! Vòm lá chắn tích phân 32/3 đã được kích hoạt thành công!",
        svgType: "integral_area",
      },
      {
        stageNumber: 4,
        gateTitle: "Chặng 4: Đỉnh Gia Tốc Phản Lực",
        gateSubtitle: "Tích phân vận tốc tìm quãng đường",
        icon: "⛰️",
        thinkingPrompt: "Mối liên hệ giữa hàm vận tốc v(t) và quãng đường s(t) đi được trong khoảng thời gian [0; 2] là phép toán gì?",
        clueText: "Quãng đường là tích phân xác định của vận tốc: s = ∫₀² (3t² + 6t)dt. Nguyên hàm của 3t² là t³, nguyên hàm của 6t là 3t².",
        ruleCode: "Quy tắc #4: Quãng đường S = ∫v(t)dt trên đoạn thời gian",
        mentorPraise: "Bản lĩnh tuyệt vời! Tàu thăm dò đã vượt chuẩn 20 mét và mở khóa cánh cổng thứ 4!",
        svgType: "velocity_rocket",
      },
      {
        stageNumber: 5,
        gateTitle: "Chặng 5: Hẻm Núi Tiệm Cận",
        gateSubtitle: "Định vị tâm đối xứng giao hai tiệm cận",
        icon: "🌋",
        thinkingPrompt: "Đối với hàm phân thức bậc nhất trên bậc nhất y = (ax+b)/(cx+d), tiệm cận đứng và tiệm cận ngang được đọc nhanh như thế nào?",
        clueText: "Cho mẫu số x - 1 = 0 ta được Tiệm cận đứng x = 1. Lấy tỉ số hệ số của x giữa tử và mẫu (2/1) ta được Tiệm cận ngang y = 2.",
        ruleCode: "Quy tắc #5: TCĐ nghiệm mẫu x = -d/c, TCN tỉ số hệ số y = a/c",
        mentorPraise: "Hoàn hảo! Đủ 5/5 Mảnh Khiên Giải Tích 12 đã hợp nhất thành Lá Chắn An Toàn Toán Học!",
        svgType: "asymptote_radar",
      },
    ],
  },
  {
    packTag: "Chuyên đề 2 · Hình học Oxyz 12",
    packSummary: "Tọa độ vectơ không gian, Phương trình mặt phẳng, Đường thẳng thông số, Mặt cầu & Góc không gian.",
    exam: {
      id: "preset-cyber-gates-oxyz-12",
      code: "CG12B",
      title: "Mật Vụ Không Gian Oxyz: Giải Mã 5 Cánh Cổng Tọa Độ 3D",
      subject: "Toán học",
      targetClass: "12",
      durationMinutes: 15,
      status: "open",
      createdAt: "2026-11-04T00:00:00.000Z",
      questions: [
        {
          id: "cg-ox-1",
          type: "multiple_choice",
          level: "NB",
          points: 2,
          text: "Cổng #1 (Trạm Radar Vectơ): Trong không gian $Oxyz$, radar phát hiện thiết bị bay từ vị trí $A(1; 2; -1)$ đến vị trí $B(3; 0; 3)$. Tọa độ vectơ độ dời $\\overrightarrow{AB}$ là:",
          options: [
            { id: "A", text: "$(2; -2; 4)$" },
            { id: "B", text: "$(4; 2; 2)$" },
            { id: "C", text: "$(-2; 2; -4)$" },
            { id: "D", text: "$(2; -1; 1)$" },
          ],
          correctAnswer: "A",
          explanation: "Lấy tọa độ điểm cuối $B$ trừ tọa độ điểm đầu $A$: $\\overrightarrow{AB} = (3-1; 0-2; 3-(-1)) = (2; -2; 4)$.",
        },
        {
          id: "cg-ox-2",
          type: "multiple_choice",
          level: "TH",
          points: 2,
          text: "Cổng #2 (Tường Lửa Mặt Phẳng): Tấm khiên phẳng $(P)$ có phương trình $2x - y + 3z - 6 = 0$. Vectơ nào dưới đây là một vectơ pháp tuyến của mặt phẳng $(P)$?",
          options: [
            { id: "A", text: "$\\vec{n} = (2; 1; 3)$" },
            { id: "B", text: "$\\vec{n} = (2; -1; 3)$" },
            { id: "C", text: "$\\vec{n} = (-1; 3; -6)$" },
            { id: "D", text: "$\\vec{n} = (2; -1; -6)$" },
          ],
          correctAnswer: "B",
          explanation: "Mặt phẳng $Ax + By + Cz + D = 0$ có vectơ pháp tuyến là $\\vec{n} = (A; B; C) = (2; -1; 3)$.",
        },
        {
          id: "cg-ox-3",
          type: "multiple_choice",
          level: "TH",
          points: 2,
          text: "Cổng #3 (Hành Lang Tia Laser): Tia laser bảo vệ đi qua điểm $M(1; 0; -2)$ và có vectơ chỉ phương $\\vec{u} = (2; 3; 1)$. Điểm nào sau đây nằm trên đường đi của tia laser?",
          options: [
            { id: "A", text: "$N(3; 3; -1)$" },
            { id: "B", text: "$P(2; 3; 1)$" },
            { id: "C", text: "$Q(-1; 3; -3)$" },
            { id: "D", text: "$K(3; -3; -1)$" },
          ],
          correctAnswer: "A",
          explanation: "Phương trình tham số tia laser: $x = 1 + 2t, y = 3t, z = -2 + t$. Ứng với $t = 1$, ta được điểm $N(3; 3; -1)$.",
        },
        {
          id: "cg-ox-4",
          type: "multiple_choice",
          level: "TH",
          points: 2,
          text: "Cổng #4 (Vòm Cầu Phòng Thủ): Vòm năng lượng hình cầu $(S)$ có phương trình $(x - 1)^2 + (y + 2)^2 + (z - 3)^2 = 16$. Tâm $I$ và bán kính $R$ của vòm cầu là:",
          options: [
            { id: "A", text: "$I(-1; 2; -3), R = 4$" },
            { id: "B", text: "$I(1; -2; 3), R = 16$" },
            { id: "C", text: "$I(1; -2; 3), R = 4$" },
            { id: "D", text: "$I(-1; 2; -3), R = 16$" },
          ],
          correctAnswer: "C",
          explanation: "Phương trình mặt cầu $(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2$ có tâm $I(1; -2; 3)$ và bán kính $R = \\sqrt{16} = 4$.",
        },
        {
          id: "cg-ox-5",
          type: "multiple_choice",
          level: "VD",
          points: 2,
          text: "Cổng #5 (Giao Điểm Tích Vô Hướng): Hai luồng sóng định vị có vectơ chỉ phương $\\vec{a} = (1; 2; 2)$ và $\\vec{b} = (2; -2; 1)$. Giá trị $\\cos(\\vec{a}, \\vec{b})$ bằng:",
          options: [
            { id: "A", text: "$0$ (Hai tia vuông góc)" },
            { id: "B", text: "$\\frac{1}{9}$" },
            { id: "C", text: "$\\frac{2}{9}$" },
            { id: "D", text: "$-\\frac{2}{9}$" },
          ],
          correctAnswer: "A",
          explanation: "Tích vô hướng $\\vec{a} \\cdot \\vec{b} = 1 \\cdot 2 + 2 \\cdot (-2) + 2 \\cdot 1 = 2 - 4 + 2 = 0$. Do đó $\\cos(\\vec{a}, \\vec{b}) = 0$, hai tia vuông góc nhau.",
        },
      ],
    },
    stages: [
      {
        stageNumber: 1,
        gateTitle: "Chặng 1: Trạm Radar Vectơ",
        gateSubtitle: "Xác định tọa độ vectơ độ dời 3D",
        icon: "🛸",
        thinkingPrompt: "Muốn tìm tọa độ vectơ AB, ta lấy tọa độ điểm nào trừ tọa độ điểm nào?",
        clueText: "Quy tắc vàng: Lấy điểm CUỐI (B) trừ điểm ĐẦU (A) theo từng trục hoành độ x, tung độ y, cao độ z: (3-1; 0-2; 3-(-1)).",
        ruleCode: "Quy tắc #1: Vectơ AB = (xB - xA; yB - yA; zB - zA)",
        mentorPraise: "Chính xác! Tọa độ bay của mục tiêu đã bị khóa chặt trên hệ trục Oxyz!",
        svgType: "oxyz_drone",
      },
      {
        stageNumber: 2,
        gateTitle: "Chặng 2: Tường Lửa Mặt Phẳng",
        gateSubtitle: "Nhận diện vectơ pháp tuyến mặt phẳng",
        icon: "🛡️",
        thinkingPrompt: "Trong phương trình tổng quát mặt phẳng Ax + By + Cz + D = 0, ba hệ số đứng trước x, y, z cho ta biết đại lượng hình học nào?",
        clueText: "Chú ý dấu của hệ số đứng trước y: Phương trình 2x - y + 3z - 6 = 0 có A = 2, B = -1, C = 3.",
        ruleCode: "Quy tắc #2: Mặt phẳng Ax + By + Cz + D = 0 có VTPT n = (A; B; C)",
        mentorPraise: "Tuyệt đỉnh! Tấm khiên phẳng đã được định hướng vuông góc chuẩn xác với vectơ pháp tuyến!",
        svgType: "plane_shield",
      },
      {
        stageNumber: 3,
        gateTitle: "Chặng 3: Hành Lang Tia Laser",
        gateSubtitle: "Kiểm tra điểm thuộc đường thẳng không gian",
        icon: "⚡",
        thinkingPrompt: "Khi dịch chuyển từ điểm M(1; 0; -2) thêm 1 lần vectơ chỉ phương u = (2; 3; 1), ta sẽ tới điểm có tọa độ nào?",
        clueText: "Cộng trực tiếp tọa độ điểm M với vectơ chỉ phương u (ứng với tham số t = 1): (1+2; 0+3; -2+1).",
        ruleCode: "Quy tắc #3: M(x₀+at; y₀+bt; z₀+ct) thuộc đường thẳng qua M₀ có VTCP u(a;b;c)",
        mentorPraise: "Quá nhạy bén! Tia laser đã xuyên qua đúng tâm điểm N(3; 3; -1)!",
        svgType: "laser_line",
      },
      {
        stageNumber: 4,
        gateTitle: "Chặng 4: Vòm Cầu Phòng Thủ",
        gateSubtitle: "Giải mã tâm và bán kính mặt cầu",
        icon: "🌐",
        thinkingPrompt: "Khi đọc tọa độ tâm I từ phương trình (x - 1)² + (y + 2)² + (z - 3)² = 16, ta cần đổi dấu như thế nào và lấy căn bậc hai của 16 ra sao?",
        clueText: "Đổi dấu các hằng số trong ngoặc: (-1 -> 1), (+2 -> -2), (-3 -> 3). Đừng quên vế phải là R² = 16 nên bán kính R = √16 = 4!",
        ruleCode: "Quy tắc #4: Mặt cầu (x-a)²+(y-b)²+(z-c)²=R² có tâm I(a;b;c), bán kính R",
        mentorPraise: "Xuất sắc! Vòm cầu phòng thủ bán kính R = 4 đã bao bọc toàn bộ căn cứ!",
        svgType: "sphere_radar",
      },
      {
        stageNumber: 5,
        gateTitle: "Chặng 5: Giao Điểm Tích Vô Hướng",
        gateSubtitle: "Tính góc giữa hai luồng sóng định vị",
        icon: "🧭",
        thinkingPrompt: "Trước khi tính độ dài từng vectơ, hãy kiểm tra tích vô hướng a.b = x₁x₂ + y₁y₂ + z₁z₂ bằng bao nhiêu?",
        clueText: "Tính tử số trước: 1×2 + 2×(-2) + 2×1 = 2 - 4 + 2 = 0. Khi tích vô hướng bằng 0 thì cos góc giữa hai vectơ bằng 0 ngay lập tức!",
        ruleCode: "Quy tắc #5: Tích vô hướng a.b = 0 ⇔ Hai vectơ vuông góc (cos = 0)",
        mentorPraise: "Hoàn hảo! Đủ 5/5 Mảnh Khiên Không Gian Oxyz đã được thu thập trọn vẹn!",
        svgType: "angle_beam",
      },
    ],
  },
  {
    packTag: "Chuyên đề 3 · Đại số & Xác suất 10–11",
    packSummary: "Đỉnh Parabol lớp 10, Sóng Lượng giác lớp 11, Cấp số cộng, Tổ hợp mật mã & Xác suất bảo vệ hệ thống.",
    exam: {
      id: "preset-cyber-gates-dai-so-10-11",
      code: "CG1011",
      title: "Mật Vụ Đại Số & Xác Suất 10–11: Giải Mã 5 Cánh Cổng Mật Mã",
      subject: "Toán học",
      targetClass: "11",
      durationMinutes: 15,
      status: "open",
      createdAt: "2026-11-04T00:00:00.000Z",
      questions: [
        {
          id: "cg-ds-1",
          type: "multiple_choice",
          level: "NB",
          points: 2,
          text: "Cổng #1 (Cầu Vòm Parabol Lớp 10): Cổng vòm ánh sáng có hình dạng Parabol $y = x^2 - 4x + 3$. Tọa độ đỉnh $I$ của cổng vòm này là:",
          options: [
            { id: "A", text: "$I(2; -1)$" },
            { id: "B", text: "$I(-2; 15)$" },
            { id: "C", text: "$I(2; 1)$" },
            { id: "D", text: "$I(4; 3)$" },
          ],
          correctAnswer: "A",
          explanation: "Hoành độ đỉnh Parabol là $x_I = -\\frac{b}{2a} = -\\frac{-4}{2 \\cdot 1} = 2$. Thay $x = 2$ vào hàm số: $y_I = 2^2 - 4(2) + 3 = -1$. Vậy đỉnh $I(2; -1)$.",
        },
        {
          id: "cg-ds-2",
          type: "multiple_choice",
          level: "TH",
          points: 2,
          text: "Cổng #2 (Sóng Lượng Giác Lớp 11): Tín hiệu sóng âm thanh biến thiên theo hàm số $y = 3\\sin x + 2$. Giá trị lớn nhất của tín hiệu sóng này bằng:",
          options: [
            { id: "A", text: "$3$" },
            { id: "B", text: "$5$" },
            { id: "C", text: "$-1$" },
            { id: "D", text: "$2$" },
          ],
          correctAnswer: "B",
          explanation: "Vì $-1 \\le \\sin x \\le 1$ với mọi $x \\in \\mathbb{R}$, nên $y_{\\max} = 3 \\cdot 1 + 2 = 5$ (đạt được khi $\\sin x = 1$).",
        },
        {
          id: "cg-ds-3",
          type: "multiple_choice",
          level: "TH",
          points: 2,
          text: "Cổng #3 (Tháp Cấp Số Cộng): Các tầng tháp năng lượng có số lõi tăng dần theo cấp số cộng $(u_n)$ biết tầng đầu $u_1 = 3$ và công sai $d = 4$. Số lõi ở tầng thứ 5 ($u_5$) là:",
          options: [
            { id: "A", text: "$15$" },
            { id: "B", text: "$23$" },
            { id: "C", text: "$19$" },
            { id: "D", text: "$12$" },
          ],
          correctAnswer: "C",
          explanation: "Áp dụng công thức số hạng tổng quát cấp số cộng: $u_5 = u_1 + (5 - 1)d = 3 + 4 \\cdot 4 = 19$.",
        },
        {
          id: "cg-ds-4",
          type: "multiple_choice",
          level: "TH",
          points: 2,
          text: "Cổng #4 (Khóa Mật Mã Hoán Vị): Để mở két sắt dữ liệu, Mật vụ cần xếp 4 chữ số khác nhau từ tập $\\{1, 2, 3, 4\\}$ thành một mã PIN 4 chữ số. Số mã PIN khác nhau có thể tạo ra là:",
          options: [
            { id: "A", text: "$16$" },
            { id: "B", text: "$12$" },
            { id: "C", text: "$24$" },
            { id: "D", text: "$4$" },
          ],
          correctAnswer: "C",
          explanation: "Mỗi cách xếp 4 chữ số khác nhau từ 4 chữ số là một hoán vị của 4 phần tử: $P_4 = 4! = 4 \\cdot 3 \\cdot 2 \\cdot 1 = 24$ mã PIN.",
        },
        {
          id: "cg-ds-5",
          type: "multiple_choice",
          level: "VD",
          points: 2,
          text: "Cổng #5 (Lá Chắn Xác Suất Độc Lập): Hệ thống có 2 lớp tường lửa hoạt động độc lập. Xác suất lớp 1 chặn được virus là $0,8$; xác suất lớp 2 chặn được virus là $0,9$. Xác suất để virus bị chặn bởi ít nhất 1 trong 2 lớp tường lửa là:",
          options: [
            { id: "A", text: "$0,72$" },
            { id: "B", text: "$0,98$" },
            { id: "C", text: "$0,90$" },
            { id: "D", text: "$0,85$" },
          ],
          correctAnswer: "B",
          explanation: "Biến cố đối là cả 2 lớp đều trượt: $P(\\overline{A}) = (1 - 0,8) \\cdot (1 - 0,9) = 0,2 \\cdot 0,1 = 0,02$. Vậy xác suất chặn thành công là $P(A) = 1 - 0,02 = 0,98$ ($98\\%$).",
        },
      ],
    },
    stages: [
      {
        stageNumber: 1,
        gateTitle: "Chặng 1: Cầu Vòm Parabol",
        gateSubtitle: "Xác định tọa độ đỉnh hàm bậc hai",
        icon: "🌉",
        thinkingPrompt: "Trục đối xứng của Parabol y = ax² + bx + c đi qua hoành độ x = -b/(2a) bằng bao nhiêu?",
        clueText: "Với a = 1, b = -4, hoành độ đỉnh là x = -(-4)/(2×1) = 2. Thay x = 2 vào y = x² - 4x + 3 để tìm tung độ đỉnh y!",
        ruleCode: "Quy tắc #1: Đỉnh Parabol có hoành độ x = -b / (2a)",
        mentorPraise: "Chuẩn xác! Điểm đáy võng I(2; -1) của Cầu Vòm Parabol đã được giải mã!",
        svgType: "parabola_bridge",
      },
      {
        stageNumber: 2,
        gateTitle: "Chặng 2: Sóng Lượng Giác",
        gateSubtitle: "Tìm biên độ cực đại của sóng sin",
        icon: "🌊",
        thinkingPrompt: "Giá trị của sin(x) luôn dao động trong đoạn nào với mọi góc x?",
        clueText: "Vì -1 ≤ sin(x) ≤ 1 nên giá trị lớn nhất của 3.sin(x) + 2 đạt được khi sin(x) = 1. Khi đó 3×1 + 2 bằng bao nhiêu?",
        ruleCode: "Quy tắc #2: Tập giá trị chuẩn -1 ≤ sin(x), cos(x) ≤ 1",
        mentorPraise: "Tuyệt vời! Tần số đỉnh sóng y = 5 đã khớp hoàn toàn với bộ thu Đội Đặc Nhiệm!",
        svgType: "trig_wave",
      },
      {
        stageNumber: 3,
        gateTitle: "Chặng 3: Tháp Cấp Số Cộng",
        gateSubtitle: "Tính số hạng tổng quát của dãy số",
        icon: "🗼",
        thinkingPrompt: "Từ tầng 1 lên tầng 5, chúng ta cần bước qua bao nhiêu khoảng công sai d?",
        clueText: "Từ u₁ lên u₅ có đúng (5 - 1) = 4 bước nhảy công sai d. Vậy u₅ = u₁ + 4d = 3 + 4×4!",
        ruleCode: "Quy tắc #3: Số hạng thứ n của CSC là uₙ = u₁ + (n - 1)d",
        mentorPraise: "Quá nhanh! Tầng tháp thứ 5 với 19 lõi năng lượng đã được thắp sáng!",
        svgType: "sequence_tower",
      },
      {
        stageNumber: 4,
        gateTitle: "Chặng 4: Khóa Mật Mã Hoán Vị",
        gateSubtitle: "Đếm số hoán vị 4 chữ số mật mã",
        icon: "🔐",
        thinkingPrompt: "Vị trí thứ nhất có 4 cách chọn, vị trí thứ hai còn 3 cách chọn... Áp dụng quy tắc nhân thì có tất cả bao nhiêu mã PIN?",
        clueText: "Số hoán vị của 4 chữ số khác nhau là P₄ = 4! = 4 × 3 × 2 × 1.",
        ruleCode: "Quy tắc #4: Hoán vị n phần tử khác nhau là Pₙ = n!",
        mentorPraise: "Xuất sắc! Ổ khóa 24 tổ hợp hoán vị đã bật mở trước tư duy sắc bén của các em!",
        svgType: "combinatorics_lock",
      },
      {
        stageNumber: 5,
        gateTitle: "Chặng 5: Lá Chắn Xác Suất",
        gateSubtitle: "Áp dụng biến cố đối cho hệ thống kép",
        icon: "🛡️",
        thinkingPrompt: "Thay vì cộng nhiều trường hợp, hãy tính xác suất để CẢ 2 lớp tường lửa đều để lọt virus là bao nhiêu?",
        clueText: "Xác suất lớp 1 lọt là (1 - 0,8) = 0,2. Xác suất lớp 2 lọt là (1 - 0,9) = 0,1. Cả hai cùng lọt là 0,2 × 0,1 = 0,02. Lấy 1 trừ đi 0,02!",
        ruleCode: "Quy tắc #5: Biến cố đối P(A) = 1 - P(Ā₁).P(Ā₂)",
        mentorPraise: "Đỉnh cao! Hệ thống tường lửa kép đạt hiệu suất 98% — đủ 5/5 Mảnh Khiên đã hoàn tất!",
        svgType: "probability_shield",
      },
    ],
  },
];

export function getCyberGatesPresetExam(examId: string): Exam | undefined {
  const found = CYBER_GATES_PACKS.find((p) => p.exam.id === examId);
  return found?.exam;
}

export function getCyberGateStageMeta(examId: string, questionIndex: number): CyberGateStageMeta {
  const pack = CYBER_GATES_PACKS.find((p) => p.exam.id === examId);
  if (pack && pack.stages[questionIndex]) {
    return pack.stages[questionIndex];
  }
  const stageNum = (questionIndex % 5) + 1;
  const fallbackIcons = ["🌲", "💧", "🏝️", "⛰️", "🌋"];
  const fallbackTitles = [
    "Rừng Đồ Thị Ảo Ảnh",
    "Hồ Tối Ưu Năng Lượng",
    "Đảo Tích Phân Lá Chắn",
    "Đỉnh Gia Tốc Phản Lực",
    "Hẻm Núi Tiệm Cận",
  ];
  const fallbackSvgs: CyberGateStageMeta["svgType"][] = [
    "cubic_graph",
    "optimization_box",
    "integral_area",
    "velocity_rocket",
    "asymptote_radar",
  ];
  return {
    stageNumber: stageNum,
    gateTitle: `Chặng ${stageNum}: ${fallbackTitles[questionIndex % 5]}`,
    gateSubtitle: `Giải mã thử thách cổng số ${stageNum}`,
    icon: fallbackIcons[questionIndex % 5],
    thinkingPrompt: "Hãy phân tích kỹ giả thiết toán học trong đề bài và loại trừ các phương án bẫy ảo!",
    clueText: "Áp dụng công thức cốt lõi của bài học, kiểm tra điều kiện xác định và dấu của biểu thức trước khi chốt đáp án.",
    ruleCode: `Mật mã Quy tắc Cổng #${stageNum} đã mở khóa`,
    mentorPraise: `Tuyệt vời! Đội Đặc Nhiệm đã giải mã thành công Cánh Cổng #${stageNum} và thu thập thêm 1 Chìa Khóa Vàng!`,
    svgType: fallbackSvgs[questionIndex % 5],
  };
}
