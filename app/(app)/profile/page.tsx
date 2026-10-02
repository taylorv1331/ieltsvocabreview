import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <section>
      <h1 className="text-2xl font-bold">Hồ sơ</h1>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
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
      </div>

      <h2 className="mt-8 text-lg font-semibold">Thống kê</h2>
      <p className="mt-1 text-slate-500">Sắp có (US-07).</p>
    </section>
  );
}
