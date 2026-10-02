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

// Thanh điều hướng cố định ở đáy màn hình, kiểu app điện thoại (mobile-first).
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md">
        {items.map(({ href, label, Icon }) => {
          // Trang phiên ôn /review cũng thuộc mục "Ôn tập"
          const active = pathname === href || (href === "/" && pathname.startsWith("/review"));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs ${
                  active ? "font-semibold text-blue-600" : "text-slate-500"
                }`}
              >
                <Icon aria-hidden size={22} strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
