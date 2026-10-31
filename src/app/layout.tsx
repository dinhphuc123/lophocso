import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lớp Học Số - Tiện ích Dạy học & Khảo thí THPT chuẩn BGD 2025",
  description: "Lớp Học Số - Nền tảng quản lý lớp học, ngân hàng đề thi chuẩn BGD 2025, chuyển đổi Word KaTeX, trộn đề, sổ điểm và đấu trí lớp học tương tác.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
