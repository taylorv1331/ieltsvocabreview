import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client dùng trong Server Component, Server Action và Route Handler.
// Phiên đăng nhập được đọc/ghi qua cookie của request.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component không được ghi cookie; proxy (US-01) sẽ lo việc làm mới phiên.
          }
        },
      },
    },
  );
}
