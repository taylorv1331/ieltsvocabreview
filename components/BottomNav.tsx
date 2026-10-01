"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Ôn tập", icon: "📖" },
  { href: "/words", label: "Kho từ", icon: "🗂️" },
  { href: "/words/new", label: "Thêm từ", icon: "➕" },
  { href: "/import", label: "Nhập từ", icon: "📥" },
  { href: "/stats", label: "Thống kê", icon: "📊" },
];

// Thanh điều hướng cố định ở đáy màn hình, kiểu app điện thoại (mobile-first).
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                  active ? "font-semibold text-blue-600" : "text-slate-500"
                }`}
              >
                <span aria-hidden className="text-lg leading-none">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
