import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const linkError = error === "link";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold">Ôn từ IELTS</h1>
      <p className="mt-2 text-slate-600">
        Nhập email, mình sẽ gửi link đăng nhập. Không cần mật khẩu.
      </p>

      {/* AC-01.4: link đã dùng hoặc hết hạn */}
      {linkError && (
        <p role="alert" className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Link đăng nhập đã hết hạn hoặc đã được dùng. Nhập email để nhận link mới.
        </p>
      )}

      <LoginForm resend={linkError} />
    </main>
  );
}
