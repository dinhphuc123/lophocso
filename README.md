# Khảo Thí Số (KhaoThiSo)

Nền tảng Khảo thí Thông minh, Chuyển đổi Đề thi Chuẩn BGD 2025 & Đấu trí Lớp học Thời gian thực.

---

## 🌟 Tính năng nổi bật

### 1. Khảo thí chuẩn cấu trúc BGD 2025
- **Nhập đề Word (.docx) tự động**: Trích xuất công thức toán từ Office Math (OMML) sang LaTeX KaTeX sắc nét, giữ nguyên định dạng, lũy thừa, phân số, tích phân và ma trận.
- **Hỗ trợ 4 định dạng câu hỏi**:
  - Trắc nghiệm nhiều lựa chọn (Phần I).
  - Trắc nghiệm Đúng/Sai thang điểm lũy tiến 4 ý (Phần II).
  - Trắc nghiệm trả lời ngắn (Phần III).
  - Tự luận kết hợp chấm điểm giáo viên (Phần IV).
- **Trộn đề thông minh**: Trộn hoán vị đáp án và câu hỏi ngẫu nhiên bằng thuật toán Fisher-Yates, tạo các mã đề khác nhau kèm ma trận đối chiếu đáp án tự động.

### 2. Game hóa lớp học (Classroom Gamification - 6 Chế độ)
- **Đấu trường RPG**: Học sinh lập đội thi đấu, tích lũy điểm kinh nghiệm và xếp hạng trực tiếp.
- **Gỡ bom sinh tử**: Trả lời nhanh để vô hiệu hóa bom trước khi phát nổ.
- **Nông trại tri thức**: Tích lũy nông sản khi trả lời đúng.
- **Đường đua tri thức**: Bứt tốc về đích, tính điểm dựa theo tốc độ trả lời.
- **Rung chuông vàng**: Đấu loại trực tiếp, người sống sót cuối cùng rung chuông.
- **Vũ điệu tri thức**: Thử thách duy trì chuỗi combo bùng nổ.

### 3. Quét thẻ trả lời thông minh (A4 Plickers Scanner)
- In thẻ mã vạch ArUco (40 mã khác nhau) trên giấy A4 thông thường.
- Giáo viên dùng camera điện thoại quét toàn bộ lớp học trong vài giây mà học sinh không cần dùng điện thoại.
- Kết quả hiển thị tức thì trên màn hình máy chiếu hoặc slide trình chiếu.

---

## 🚀 Công nghệ sử dụng

- **Frontend / Framework**: Next.js (App Router), React 19, Tailwind CSS v4, Lucide Icons, KaTeX.
- **Backend / Realtime**: Next.js Serverless API Routes, Server-Sent Events (SSE), Supabase (PostgreSQL & Realtime), Upstash Redis Adapter.
- **Testing**: Node Test Runner, TypeScript 5.

---

## 💻 Hướng dẫn chạy cục bộ (Local Development)

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev
```

Mở trình duyệt tại: `http://localhost:3000`

---

## 🧪 Kiểm thử (Unit Tests)

```bash
npm test
```

---

## 📄 Bản quyền

Giấy phép MIT © 2025 - Khảo Thí Số.
