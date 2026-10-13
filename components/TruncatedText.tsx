"use client";

import { useRef, useState } from "react";

// Một dòng chữ, dài quá thì cắt "…".
// Máy tính: rê chuột vào thì hiện ngay khung chứa nội dung đầy đủ — chỉ khi chữ thực sự bị cắt.
// (Khung gợi ý mặc định của trình duyệt qua thuộc tính title hiện chậm ~1–2 giây và không chỉnh được.)
export default function TruncatedText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);

  function handleEnter() {
    const el = ref.current;
    if (el && el.scrollWidth > el.clientWidth) setOpen(true);
  }

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={() => setOpen(false)}>
      <p ref={ref} className={`truncate ${className}`}>
        {text}
      </p>
      {open && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-full left-0 z-10 mt-1 max-w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white shadow-lg"
        >
          {text}
        </div>
      )}
    </div>
  );
}
