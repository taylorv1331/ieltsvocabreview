import type { Metadata } from "next";
import { Inter } from "next/font/google";
import BottomNav from "@/components/BottomNav";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        {/* pb-24 chừa chỗ để nội dung không bị thanh điều hướng che */}
        <main className="mx-auto max-w-md px-4 pt-6 pb-24">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
