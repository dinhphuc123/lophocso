# Nghiên cứu và Bóc tách giao diện: dethiso.vn/teacher/dashboard

## 1. Thông tin chung
- **Nguồn:** `https://dethiso.vn/teacher/dashboard`
- **Mục đích:** Bảng điều khiển dành cho giáo viên trên nền tảng Đề Thi Số (tạo đề online, chấm trắc nghiệm/tự luận, quản lý lớp học, trò chơi đấu trường học tập).
- **Ngăn xếp công nghệ nguồn:** Next.js (App Router), Tailwind CSS, React, Lucide Icons, Cloudflare.

## 2. Bản đồ cấu trúc giao diện
- **Header:**
  - Lời chào thời gian động ("Chào buổi sáng / trưa / chiều / tối, Thầy/Cô")
  - Thông báo (Badge số lượng chưa đọc)
  - Nút chuyển theme Dark/Light
  - Avatar & Thông tin giáo viên
  - Nút Mở menu điều hướng (Mobile drawer)
- **Sidebar (Thanh điều hướng):**
  - **Logo:** Đề Thi Số (`dethiso.vn`)
  - **Tổng quan** (`/teacher/dashboard`) - Đang chọn
  - **Đề thi:** Đề của tôi, Tạo đề thi (từ Word/PDF, ma trận AI, ngân hàng câu hỏi, trộn đề)
  - **Lớp học:** Lớp của tôi, Tạo lớp, Sổ điểm
  - **Trò chơi trên lớp:** Đấu trường RPG, Gỡ Bom, Rung Chuông Vàng, Nông trại, Bậc Thang Lên Mây
  - **Chấm phiếu OMR:** Camera quét phiếu trắc nghiệm
  - **Giáo án NLS:** Giáo án Năng lực số
  - **Báo cáo & Thống kê:** Báo cáo năng lực, Lịch sử nộp bài
  - **Cài đặt:** Cài đặt tài khoản
- **Thẻ chỉ số tổng quan (Stat Cards):**
  - Bài nộp 7 ngày (kèm % tăng giảm so với 7 ngày trước)
  - Điểm trung bình tuần (% từ 8 trở lên, % dưới 5)
  - Đang làm bài ngay lúc này (live polling status)
  - Việc cần làm: Bài tự luận chờ chấm, đề sắp hết hạn, đề nháp chưa xuất bản
- **Khối Bắt đầu nhanh (Quick Start 3 bước):**
  - Bước 1: Nhập đề từ Word (Tự tách câu & đáp án)
  - Bước 2: Soát & xuất bản đề
  - Bước 3: Gửi link đề cho học sinh hoặc giao cho lớp
  - Video hướng dẫn giáo viên (Thầy Dũng Công Nghệ)
- **Giám sát trực tiếp (Live Monitor):**
  - Bảng học sinh đang làm bài thời gian thực, tiến độ làm bài
- **Báo cáo & Phân tích chuyên sâu:**
  - Biểu đồ nộp bài 7 ngày theo thứ trong tuần (Thứ Hai -> Chủ Nhật)
  - Danh sách "Câu nhiều học sinh sai nhất" (Đề · Câu · % Sai để giáo viên kịp thời chữa bài)
- **Bảng danh sách đề thi gần đây:**
  - Bộ lọc: Đang mở | Nháp | Chờ chấm | Tất cả
  - Chi tiết từng đề: Tên đề thi, môn, số câu, ngày tạo, hạn nộp, số bài đã nộp, nút thao tác (Gửi link, Chấm bài, Xem kết quả, Trình chiếu).
