import ComingSoon from "@/components/ComingSoon";
import { createClient } from "@/lib/supabase/server";

// Giai đoạn 0: trang tạm, kèm dòng kiểm tra kết nối Supabase. Sẽ thay bằng màn hình Ôn tập ở US-03.
export const dynamic = "force-dynamic";

async function checkSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false, message: "Chưa có biến môi trường Supabase trong .env.local" };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("import_fields").select("key", { head: true, count: "exact" });
  return error
    ? { ok: false, message: `Lỗi kết nối Supabase: ${error.message}` }
    : { ok: true, message: "Đã kết nối Supabase" };
}

export default async function HomePage() {
  const status = await checkSupabase();
  return (
    <>
      <ComingSoon title="Ôn tập hôm nay" story="US-03, US-04" />
      <p className={`mt-6 rounded-lg p-3 text-sm ${status.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
        {status.ok ? "✅" : "⚠️"} {status.message}
      </p>
    </>
  );
}
