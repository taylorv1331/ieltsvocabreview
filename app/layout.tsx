import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME } from "@/lib/app";

// Font có đủ dấu tiếng Việt
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  // Tên dưới icon khi "Thêm vào MH chính" trên iPhone
  appleWebApp: { title: APP_SHORT_NAME },
};

// Layout gốc dùng chung cho mọi trang (kể cả trang đăng nhập)
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
