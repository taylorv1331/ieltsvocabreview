"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, CirclePlus, CircleUser, FileUp, LibraryBig } from "lucide-react";

const items = [
  { href: "/", label: "Ôn tập", Icon: BookOpenCheck },
  { href: "/words", label: "Kho từ", Icon: LibraryBig },
  { href: "/words/new", label: "Thêm từ", Icon: CirclePlus },
  { href: "/import", label: "Nhập từ", Icon: FileUp },
  { href: "/profile", label: "Hồ sơ", Icon: CircleUser },
];

// Thanh điều hướng responsive:
// - Điện thoại (< 768px): cố định ở đáy màn hình, icon trên chữ (mobile-first)
// - Từ 768px (tiền tố md:): nằm ngang trên đầu trang, có tên app bên trái
export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:sticky md:top-0 md:bottom-auto md:border-t-0 md:border-b md:pb-0">
      <div className="mx-auto flex max-w-md md:max-w-3xl md:items-center md:px-4">
        <Link href="/" className="hidden shrink-0 text-lg font-bold text-slate-900 md:block">
          Ôn từ IELTS
        </Link>
        <ul className="flex flex-1 md:ml-auto md:flex-none md:gap-1 md:py-2">
          {items.map(({ href, label, Icon }) => {
            // Trang phiên ôn /review cũng thuộc mục "Ôn tập"
            const active = pathname === href || (href === "/" && pathname.startsWith("/review"));
            return (
              <li key={href} className="flex-1 md:flex-none">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs md:min-h-11 md:flex-row md:gap-2 md:rounded-lg md:px-3 md:text-sm ${
                    active
                      ? "font-semibold text-blue-600 md:bg-blue-50"
                      : "text-slate-500 md:hover:bg-slate-100"
                  }`}
                >
                  <Icon aria-hidden size={22} strokeWidth={active ? 2.25 : 1.75} className="md:size-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
