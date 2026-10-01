import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Người dùng bấm link trong email sẽ tới đây, kèm token_hash và type.
// Cách "token hash" cho phép mở link trên thiết bị khác với thiết bị đã gửi (US-01).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    // AC-01.3: email chưa có tài khoản thì Supabase đã tự tạo lúc gửi link; bước này chỉ xác nhận
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // AC-01.4 / BR-13a: link sai, hết hạn hoặc đã dùng → về trang đăng nhập kèm thông báo
  return NextResponse.redirect(new URL("/login?error=link", request.url));
}
