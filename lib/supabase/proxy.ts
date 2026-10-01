import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Các đường dẫn ai cũng vào được, không cần đăng nhập
const PUBLIC_PATHS = ["/login", "/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Chạy trước mỗi request: làm mới phiên đăng nhập trong cookie và chặn người chưa đăng nhập.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // Không cho CDN lưu cache phản hồi có cookie đăng nhập
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // getClaims() kiểm tra chữ ký của token, không chỉ đọc cookie
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  // Chuyển hướng nhưng giữ lại cookie vừa được làm mới
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  // AC-01.1: chưa đăng nhập mà mở trang trong app → về trang đăng nhập
  if (!loggedIn && !isPublic(pathname)) return redirectTo("/login");

  // Đã đăng nhập rồi thì không cần thấy trang đăng nhập nữa
  if (loggedIn && pathname === "/login") return redirectTo("/");

  return response;
}
