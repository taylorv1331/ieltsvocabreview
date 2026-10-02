"use client";

import { useEffect, useRef, useState } from "react";
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

// Sau khi chấm: giữ màn hình đáp án + câu phản hồi trong 3 giây rồi mới sang thẻ tiếp theo
const ADVANCE_MS = 3000;
// Từ đã Quên quay lại cuối phiên: hiện lời nhắc trong 3 giây
const RETRY_NOTICE_MS = 3000;

// Kết quả vừa chấm, đang chờ chuyển thẻ
type Pending = { rating: Rating; nextQueue: DueWord[] };

export default function ReviewSession({ initialCards }: { initialCards: DueWord[] }) {
  const router = useRouter();
  // Hàng đợi của phiên: thẻ đầu tiên là thẻ đang ôn
  const [queue, setQueue] = useState(initialCards);
  const [done, setDone] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  // id của từ đang hiện lời nhắc "Cùng ôn lại từ này nào"
  const [retryNoticeFor, setRetryNoticeFor] = useState<string | null>(null);
  // Những từ đã bấm Quên trong phiên này (không cần vẽ lại giao diện nên dùng ref)
  const forgottenIds = useRef(new Set<string>());
  // Các bộ hẹn giờ đang chạy, để huỷ khi rời trang giữa chừng
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  function later(fn: () => void, ms: number) {
    const timer = setTimeout(fn, ms);
    timers.current.push(timer);
    return timer;
  }

  // Sang thẻ tiếp theo, hoặc kết thúc phiên nếu đã hết thẻ
  function advance(p: Pending) {
    if (p.nextQueue.length === 0) {
      // Ôn hết → về trang Ôn tập để thấy "Xong bài hôm nay" (AC-03.2)
      router.replace("/");
      router.refresh();
      return;
    }
    setDone((d) => d + 1);
    setShowAnswer(false);
    setQueue(p.nextQueue);
    setPending(null);

    // AC-04.3: từ đã Quên quay lại cuối phiên → nhắc "Cùng ôn lại từ này nào"
    const next = p.nextQueue[0];
    if (forgottenIds.current.has(next.id)) {
      setRetryNoticeFor(next.id);
      later(() => setRetryNoticeFor((cur) => (cur === next.id ? null : cur)), RETRY_NOTICE_MS);
    }
  }

  const card = queue[0];
  if (!card) return null;

  async function handleRate(rating: Rating) {
    if (pending) return;
    const rest = queue.slice(1);
    // AC-04.3: Quên → đưa thẻ xuống cuối phiên hôm nay
    const p: Pending = { rating, nextQueue: rating === 0 ? [...rest, card] : rest };

    // Hiện câu phản hồi ngay, lưu kết quả chạy song song.
    // Chỉ sang thẻ tiếp khi ĐỦ cả hai: đã hết 3 giây VÀ đã lưu xong.
    setError(null);
    setPending(p);
    let saved = false;
    let timeUp = false;
    const timer = later(() => {
      timeUp = true;
      if (saved) advance(p);
    }, ADVANCE_MS);

    let ok = false;
    let message = "Không lưu được kết quả. Vui lòng thử lại.";
    try {
      const result = await rateWord(card.id, rating);
      ok = result.ok;
      if (!result.ok) message = result.message;
    } catch {
      // Mất mạng hoặc server lỗi → dùng thông báo mặc định
    }

    if (!ok) {
      // Lưu lỗi → ở lại thẻ này để bấm lại, không chuyển thẻ
      clearTimeout(timer);
      setPending(null);
      setError(message);
      return;
    }

    if (rating === 0) forgottenIds.current.add(card.id);
    saved = true;
    if (timeUp) advance(p);
  }

  // Khoá 4 nút khi đang hiện câu phản hồi (tránh chấm 2 lần)
  const locked = pending !== null;

  return (
    <section className="mx-auto max-w-xl">
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
        <>
          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="mt-4 min-h-12 w-full rounded-lg bg-slate-900 font-semibold text-white active:bg-slate-700"
          >
            Xem đáp án
          </button>
          {/* AC-04.3: từ đã Quên quay lại cuối phiên */}
          {retryNoticeFor === card.id && (
            <p
              role="status"
              className="mt-3 rounded-xl border border-violet-200 bg-violet-100 px-4 py-3 text-center font-medium text-violet-800"
            >
              Cùng ôn lại từ này nào 💪
            </p>
          )}
        </>
      ) : (
        // AC-04.1: 4 nút Quên / Khó / Nhớ / Dễ
        <>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {RATINGS.map((r) => {
              // Đang hiện phản hồi: nút vừa chọn giữ màu + viền đậm, 3 nút còn lại mờ đi
              const chosen = pending?.rating === r.value;
              const dimmed = pending !== null && !chosen;
              return (
                <button
                  key={r.value}
                  type="button"
                  disabled={locked}
                  aria-pressed={chosen}
                  onClick={() => handleRate(r.value)}
                  className={`min-h-12 rounded-lg border font-semibold ${RATING_STYLES[r.value]} ${
                    chosen ? "ring-2 ring-current" : ""
                  } ${dimmed ? "opacity-30" : ""}`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Câu phản hồi hiện ngay dưới 4 nút; chưa chấm thì hiện chú thích */}
          {pending ? (
            <p
              role="status"
              className={`mt-3 rounded-xl border px-4 py-3 text-center font-medium ${RATING_STYLES[pending.rating]}`}
            >
              {RATING_FEEDBACK[pending.rating]}
            </p>
          ) : (
            <RatingGuide />
          )}
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
