import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/app";
import SwaggerUi from "./SwaggerUi";

export const metadata: Metadata = { title: `Tài liệu API · ${APP_NAME}` };

// Trang kỹ thuật để trình bày lớp business logic (không phải màn hình cho người học).
// Nút và nhãn của Swagger UI là tiếng Anh — ngoại lệ ghi trong CLAUDE.md.
export default function ApiDocsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold">Tài liệu API — lớp business logic</h1>
      <p className="mt-2 text-slate-600">
        Các API dưới đây gọi đúng hàm mà app đang dùng và không đọc / ghi dữ liệu người dùng. Bấm một
        API → <strong>Try it out</strong> → chọn ví dụ → <strong>Execute</strong>.
      </p>
      <Link href="/" className="mt-2 inline-flex min-h-11 items-center text-sm text-pink-700 underline">
        ← Về app
      </Link>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white">
        <SwaggerUi />
      </div>
    </main>
  );
}
