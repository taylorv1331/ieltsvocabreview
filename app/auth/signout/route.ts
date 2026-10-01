import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Nút "Đăng xuất" gửi POST tới đây
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303: sau POST thì trình duyệt mở trang đăng nhập bằng GET
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
