import ComingSoon from "@/components/ComingSoon";
import { createClient } from "@/lib/supabase/server";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <>
      <ComingSoon title="Thống kê" story="US-07" />

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Đang đăng nhập bằng</p>
        <p className="mt-1 font-medium break-all">{data.user?.email}</p>
        {/* Form gửi POST tới /auth/signout, chạy được cả khi chưa tải xong JavaScript */}
        <form action="/auth/signout" method="post" className="mt-4">
          <button
            type="submit"
            className="min-h-11 w-full rounded-lg border border-slate-300 font-medium text-slate-700 active:bg-slate-100"
          >
            Đăng xuất
          </button>
        </form>
      </section>
    </>
  );
}
