import Link from "next/link";

// Trang 404 bằng tiếng Việt (thay trang mặc định tiếng Anh của Next.js)
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Không tìm thấy trang</h1>
      <p className="text-slate-600">Trang này không tồn tại, hoặc từ bạn tìm đã bị xoá.</p>
      <Link
        href="/words"
        className="flex min-h-11 items-center justify-center rounded-lg bg-pink-700 px-6 font-semibold text-white active:bg-pink-800"
      >
        Về Kho từ
      </Link>
    </main>
  );
}
