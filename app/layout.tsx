import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Font có đủ dấu tiếng Việt
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ôn từ IELTS",
  description: "Ôn từ vựng IELTS theo phương pháp lặp lại ngắt quãng",
};

// Layout gốc dùng chung cho mọi trang (kể cả trang đăng nhập)
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
