import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import FlashMessage from "@/components/FlashMessage";
import TruncatedText from "@/components/TruncatedText";
import { meaningsSummary, softHyphenate } from "@/lib/words";

export default async function WordsPage({ searchParams }: PageProps<"/words">) {
  const { deleted } = await searchParams;
  const supabase = await createClient();
  // Từ mới thêm lên đầu; RLS chỉ trả về từ của mình
  const { data: words, error } = await supabase
    .from("words")
    .select("id, term, word_senses(sort_order, meaning_vi)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">Kho từ</h1>
        <p className="text-slate-500">{words.length} từ</p>
      </div>

      {typeof deleted === "string" && (
        <div className="mt-4">
          <FlashMessage message={`Đã xoá “${deleted}”.`} cleanPath="/words" />
        </div>
      )}

      {words.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-slate-600">Kho của bạn chưa có từ nào.</p>
          <Link
            href="/words/new"
            className="mx-auto mt-4 flex min-h-11 max-w-xs items-center justify-center rounded-lg bg-pink-700 font-semibold text-white active:bg-pink-800 md:hover:bg-pink-800"
          >
            Thêm từ đầu tiên
          </Link>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {words.map((word) => (
            <li key={word.id}>
              {/* Bấm vào dòng → trang chi tiết (US-05) */}
              <Link
                href={`/words/${word.id}`}
                className="flex min-h-14 items-center gap-3 px-4 py-2 active:bg-slate-50 md:hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p lang="en" className="term-wrap font-medium">{softHyphenate(word.term)}</p>
                  {/* BR-14: các nghĩa nối bằng " · "; dài thì cắt "…", rê chuột (máy tính) hiện ngay đầy đủ */}
                  <TruncatedText
                    text={meaningsSummary(
                      [...word.word_senses].sort((a, b) => a.sort_order - b.sort_order),
                    )}
                    className="text-sm text-slate-500"
                  />
                </div>
                <ChevronRight aria-hidden size={18} className="shrink-0 text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
