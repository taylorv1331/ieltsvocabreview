import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateVN, relativeDayLabel, todayVN } from "@/lib/date";
import WordDetails from "@/components/WordDetails";
import DeleteWordButton from "@/components/DeleteWordButton";
import FlashMessage from "@/components/FlashMessage";

export default async function WordDetailPage({ params, searchParams }: PageProps<"/words/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();
  const { data: word } = await supabase
    .from("words")
    .select("id, term, part_of_speech, meaning_vi, definition_en, example, collocations, notes, due_date")
    .eq("id", id)
    .maybeSingle();
  // Không có hoặc không phải từ của mình (RLS) → trang "Không tìm thấy"
  if (!word) notFound();

  const today = todayVN(); // BR-00

  return (
    <section className="mx-auto max-w-xl">
      <Link
        href="/words"
        className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-slate-600"
      >
        <ChevronLeft aria-hidden size={18} />
        Kho từ
      </Link>

      {saved === "1" && (
        <div className="mb-3">
          <FlashMessage message="✅ Đã lưu thay đổi" cleanPath={`/words/${id}`} />
        </div>
      )}

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <WordDetails word={word} />
      </article>

      {/* Chỉ để xem; sửa nội dung không làm đổi lịch ôn (AC-05.1) */}
      <p className="mt-3 text-sm text-slate-600">
        Lần ôn tới: <strong>{formatDateVN(word.due_date)}</strong> (
        {relativeDayLabel(today, word.due_date)})
      </p>

      <div className="mt-5 flex gap-2">
        <Link
          href={`/words/${id}/sua`}
          className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-pink-700 font-semibold text-white active:bg-pink-800 md:hover:bg-pink-800"
        >
          Sửa
        </Link>
        <DeleteWordButton id={word.id} term={word.term} />
      </div>
    </section>
  );
}
