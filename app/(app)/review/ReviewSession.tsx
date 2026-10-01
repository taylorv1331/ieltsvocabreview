"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DueWord } from "@/lib/review";
import { RATINGS, type Rating } from "@/lib/srs";
import { PARTS_OF_SPEECH } from "@/lib/words";
import { rateWord } from "./actions";

const RATING_STYLES: Record<Rating, string> = {
  0: "bg-red-600 active:bg-red-700",
  1: "bg-amber-500 active:bg-amber-600",
  2: "bg-green-600 active:bg-green-700",
  3: "bg-blue-600 active:bg-blue-700",
};

export default function ReviewSession({ initialCards }: { initialCards: DueWord[] }) {
  const router = useRouter();
  // Hàng đợi của phiên: thẻ đầu tiên là thẻ đang ôn
  const [queue, setQueue] = useState(initialCards);
  const [done, setDone] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const card = queue[0];
  if (!card) return <p className="mt-10 text-center text-slate-500">Đang kết thúc phiên ôn…</p>;

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

    if (nextQueue.length === 0) {
      // Ôn hết → về trang Ôn tập để thấy "Xong bài hôm nay" (AC-03.2)
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <section>
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
        <div className="mt-4 grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              type="button"
              disabled={saving}
              onClick={() => handleRate(r.value)}
              className={`min-h-12 rounded-lg font-semibold text-white disabled:opacity-50 ${RATING_STYLES[r.value]}`}
            >
              {r.label}
            </button>
          ))}
        </div>
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
