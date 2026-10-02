"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Info } from "lucide-react";
import type { DueWord } from "@/lib/review";
import { RATINGS, type Rating } from "@/lib/srs";
import { PARTS_OF_SPEECH } from "@/lib/words";
import { rateWord } from "./actions";

// Màu pastel: nền nhạt, chữ đậm cùng tông để vẫn dễ đọc
const RATING_STYLES: Record<Rating, string> = {
  0: "border-red-200 bg-red-100 text-red-800 active:bg-red-200 md:hover:bg-red-200",
  1: "border-amber-200 bg-amber-100 text-amber-800 active:bg-amber-200 md:hover:bg-amber-200",
  2: "border-green-200 bg-green-100 text-green-800 active:bg-green-200 md:hover:bg-green-200",
  3: "border-blue-200 bg-blue-100 text-blue-800 active:bg-blue-200 md:hover:bg-blue-200",
};

// Chú thích "Nên chọn thẻ nào?": khi nào chọn nút nào
const RATING_HINTS: Record<Rating, string> = {
  0: "Không nhớ ra, hoặc nhớ sai",
  1: "Nhớ ra nhưng phải nghĩ lâu",
  2: "Nhớ đúng sau chút suy nghĩ",
  3: "Nhìn là biết ngay",
};

// Câu phản hồi hiện sau khi chấm (ứng với BR-01 → BR-04).
// "you're the best" là ngoại lệ tiếng Anh có chủ ý — xem CLAUDE.md
const RATING_FEEDBACK: Record<Rating, string> = {
  0: "Bạn chưa nhớ từ này rồi, xíu nữa mình sẽ ôn lại nha 🥲",
  1: "Có vẻ từ này hơi khó với bạn ha, mình sẽ nhắc lại sớm thôi 🧐",
  2: "Khá lắm, bạn dần đưa từ này vào vốn từ của mình rồi đó 🤓",
  3: "Thật xuất sắc, you're the best 🤩",
};

// Thời gian hiện câu phản hồi (mili-giây)
const FEEDBACK_MS = 2500;

export default function ReviewSession({ initialCards }: { initialCards: DueWord[] }) {
  const router = useRouter();
  // Hàng đợi của phiên: thẻ đầu tiên là thẻ đang ôn
  const [queue, setQueue] = useState(initialCards);
  const [done, setDone] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Câu phản hồi đang hiện; `id` tăng mỗi lần chấm để bộ đếm giờ chạy lại từ đầu
  const [feedback, setFeedback] = useState<{ id: number; rating: Rating } | null>(null);

  // Tự ẩn câu phản hồi sau FEEDBACK_MS
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  const card = queue[0];
  if (!card) {
    return (
      <>
        <FeedbackToast feedback={feedback} />
        <p className="mt-10 text-center text-slate-500">Đang kết thúc phiên ôn…</p>
      </>
    );
  }

  async function handleRate(rating: Rating) {
    setSaving(true);
    setError(null);
    const result = await rateWord(card.id, rating);
    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    const rest = queue.slice(1);
    // AC-04.3: Quên → đưa thẻ xuống cuối phiên hôm nay
    const nextQueue = rating === 0 ? [...rest, card] : rest;
    setDone((d) => d + 1);
    setShowAnswer(false);
    setQueue(nextQueue);
    setFeedback({ id: done, rating }); // done khác nhau ở mỗi lần chấm → làm mã riêng

    if (nextQueue.length === 0) {
      // Ôn hết → chờ người học đọc câu phản hồi, rồi về trang Ôn tập để thấy "Xong bài hôm nay" (AC-03.2)
      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 1800);
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <FeedbackToast feedback={feedback} />
      <p className="text-sm text-slate-500">
        Thẻ {done + 1}/{done + queue.length}
      </p>

      <article className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {!showAnswer ? (
          // AC-04.1: mặt trước chỉ có từ
          <p className="py-12 text-center text-3xl font-bold break-words">{card.term}</p>
        ) : (
          <Answer card={card} />
        )}
      </article>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!showAnswer ? (
        <button
          type="button"
          onClick={() => setShowAnswer(true)}
          className="mt-4 min-h-12 w-full rounded-lg bg-slate-900 font-semibold text-white active:bg-slate-700"
        >
          Xem đáp án
        </button>
      ) : (
        // AC-04.1: 4 nút Quên / Khó / Nhớ / Dễ
        <>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                type="button"
                disabled={saving}
                onClick={() => handleRate(r.value)}
                className={`min-h-12 rounded-lg border font-semibold disabled:opacity-50 ${RATING_STYLES[r.value]}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <RatingGuide />
        </>
      )}
    </section>
  );
}

// Mặt sau: hiện mọi thông tin của từ, ô trống thì ẩn (AC-04.1)
function Answer({ card }: { card: DueWord }) {
  const pos = PARTS_OF_SPEECH.find((p) => p.value === card.part_of_speech)?.label;
  const collocations = card.collocations
    ?.split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-2xl font-bold break-words">{card.term}</p>
        {pos && <span className="shrink-0 text-sm text-slate-500">{pos}</span>}
      </div>
      <p className="text-lg">{card.meaning_vi}</p>
      {card.definition_en && <p className="text-slate-600 italic">{card.definition_en}</p>}
      {card.example && (
        <Detail label="Ví dụ">
          <p>{card.example}</p>
        </Detail>
      )}
      {collocations && collocations.length > 0 && (
        <Detail label="Collocation">
          <ul className="list-disc pl-5">
            {collocations.map((c, i) => (
              <li key={`${i}-${c}`}>{c}</li>
            ))}
          </ul>
        </Detail>
      )}
      {card.notes && (
        <Detail label="Ghi chú">
          <p className="whitespace-pre-line">{card.notes}</p>
        </Detail>
      )}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// Chú thích ý nghĩa 4 nút, thu gọn được (mặc định đóng để không chiếm chỗ trên điện thoại)
function RatingGuide() {
  return (
    <details className="group mt-3 text-sm">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-1.5 text-slate-500 [&::-webkit-details-marker]:hidden">
        <Info aria-hidden size={16} />
        Nên chọn thẻ nào?
        <ChevronDown aria-hidden size={16} className="transition-transform group-open:rotate-180" />
      </summary>
      <dl className="mt-1 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
        {RATINGS.map((r) => (
          <div key={r.value} className="flex items-center gap-3">
            <dt
              className={`w-14 shrink-0 rounded-md border px-2 py-0.5 text-center font-semibold ${RATING_STYLES[r.value]}`}
            >
              {r.label}
            </dt>
            <dd className="text-slate-700">{RATING_HINTS[r.value]}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

// Dải thông báo nổi phía trên (không đẩy thẻ xuống), cùng màu pastel với nút vừa chấm
function FeedbackToast({ feedback }: { feedback: { id: number; rating: Rating } | null }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-4 z-20 mx-auto max-w-xl md:top-20"
    >
      {feedback && (
        <p
          key={feedback.id}
          className={`rounded-xl border px-4 py-3 text-center font-medium shadow-md ${RATING_STYLES[feedback.rating]}`}
        >
          {RATING_FEEDBACK[feedback.rating]}
        </p>
      )}
    </div>
  );
}
