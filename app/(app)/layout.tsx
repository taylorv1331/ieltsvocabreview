import AppNav from "@/components/AppNav";

// Layout cho các trang bên trong app (đã đăng nhập)
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Đặt trước nội dung để trên web thanh điều hướng nằm đầu trang; trên điện thoại nó cố định ở đáy */}
      <AppNav />
      {/* Điện thoại: rộng tối đa 448px, pb-24 chừa chỗ cho thanh ở đáy.
          Web (md:): rộng tối đa 768px, không cần chừa chỗ dưới đáy */}
      <main className="mx-auto max-w-md px-4 pt-6 pb-24 md:max-w-3xl md:pt-8 md:pb-12">
        {children}
      </main>
    </>
  );
}
