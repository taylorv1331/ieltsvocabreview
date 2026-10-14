"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteWord } from "@/app/(app)/words/actions";
import { softHyphenate } from "@/lib/words";

// AC-05.2: nút Xoá + hộp xác nhận (dùng thẻ <dialog> có sẵn của trình duyệt)
export default function DeleteWordButton({ id, term }: { id: string; term: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    const result = await deleteWord(id);
    if (!result.ok) {
      setDeleting(false);
      setError(result.message);
      return;
    }
    dialogRef.current?.close();
    router.push(`/words?deleted=${encodeURIComponent(result.term)}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          dialogRef.current?.showModal();
        }}
        className="min-h-11 flex-1 rounded-lg border border-red-300 font-semibold text-red-700 active:bg-red-50 md:hover:bg-red-50"
      >
        Xoá
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-title"
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5 shadow-xl backdrop:bg-slate-900/40"
      >
        <h2 id="delete-title" className="term-wrap text-lg font-bold">
          Xoá từ &ldquo;{softHyphenate(term)}&rdquo;?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Không thể hoàn tác, hãy chắc chắn bạn đã nằm lòng từ này trước khi xoá. Thống kê và chuỗi ngày học của bạn vẫn được giữ.
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            autoFocus
            disabled={deleting}
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 flex-1 rounded-lg border border-slate-300 font-medium text-slate-700 active:bg-slate-100"
          >
            Huỷ
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirm}
            className="min-h-11 flex-1 rounded-lg bg-red-600 font-semibold text-white active:bg-red-700 disabled:opacity-60"
          >
            {deleting ? "Đang xoá…" : "Xoá"}
          </button>
        </div>
      </dialog>
    </>
  );
}
