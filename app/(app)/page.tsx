import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { daysBetween, formatDateVN, todayVN } from "@/lib/date";
import { getDueWords, getNextDueDate } from "@/lib/review";

// "N ngày nữa" / "ngày mai" cho ngày ôn kế tiếp
function relativeLabel(days: number) {
  return days === 1 ? "ngày mai" : `${days} ngày nữa`;
}

export default async function ReviewPage() {
  const supabase = await createClient();
  const today = todayVN(); // BR-00
  const dueWords = await getDueWords(supabase, today);

  if (dueWords.length === 0) {
    const nextDue = await getNextDueDate(supabase, today);
    return (
      <section>
        <h1 className="text-2xl font-bold">Ôn tập hôm nay</h1>
        {nextDue ? (
          // AC-03.2: hết từ đến hạn → "Xong bài hôm nay" + ngày ôn kế tiếp
          <div className="mt-10 text-center">
            <p className="text-5xl" aria-hidden>
              🎉
            </p>
            <p className="mt-3 text-xl font-semibold">Xong bài hôm nay</p>
            <p className="mt-2 text-slate-600">
              Lần ôn tiếp theo: <strong>{formatDateVN(nextDue)}</strong> (
              {relativeLabel(daysBetween(today, nextDue))})
            </p>
          </div>
        ) : (
          // Không có từ đến hạn và cũng không có từ nào phía sau → kho trống
          <div className="mt-10 text-center">
            <p className="text-slate-600">Kho của bạn chưa có từ nào.</p>
            <Link
              href="/words/new"
              className="mt-4 flex min-h-11 items-center justify-center rounded-lg bg-blue-600 font-semibold text-white active:bg-blue-700"
            >
              Thêm từ đầu tiên
            </Link>
          </div>
        )}
      </section>
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Ôn tập hôm nay</h1>
      <p className="mt-1 text-slate-600">{dueWords.length} từ cần ôn</p>

      {/* US-04 sẽ bật nút này để mở thẻ theo đúng thứ tự danh sách */}
      <button
        type="button"
        disabled
        className="mt-4 min-h-11 w-full rounded-lg bg-slate-300 font-semibold text-slate-600"
      >
        Bắt đầu ôn
      </button>
      <p className="mt-1 text-center text-xs text-slate-500">Sắp có (US-04)</p>

      {/* AC-03.1: chỉ hiện từ vựng, không hiện nghĩa để không lộ đáp án */}
      <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {dueWords.map((word) => {
          const overdue = daysBetween(word.due_date, today);
          return (
            <li key={word.id} className="flex min-h-11 items-center justify-between gap-3 px-4 py-2">
              <span className="font-medium break-all">{word.term}</span>
              <span
                className={`shrink-0 text-sm ${overdue > 0 ? "text-amber-700" : "text-slate-500"}`}
              >
                {overdue > 0 ? `Quá hạn ${overdue} ngày` : "Hôm nay"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
