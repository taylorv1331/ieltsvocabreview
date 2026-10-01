import BottomNav from "@/components/BottomNav";

// Layout cho các trang bên trong app (đã đăng nhập): có thanh điều hướng ở đáy
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* pb-24 chừa chỗ để nội dung không bị thanh điều hướng che */}
      <main className="mx-auto max-w-md px-4 pt-6 pb-24">{children}</main>
      <BottomNav />
    </>
  );
}
