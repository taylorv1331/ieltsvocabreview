import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 gọi file này là "proxy" (bản cũ gọi là "middleware")
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Chạy cho mọi trang, trừ file tĩnh (JS/CSS, ảnh, icon, manifest)
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
