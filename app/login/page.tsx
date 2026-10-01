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

      <LoginForm resend={linkError} />
    </main>
  );
}
