import { PARTS_OF_SPEECH, type WordContent } from "@/lib/words";

// Hiện mọi thông tin của một từ, ô trống thì ẩn.
// Dùng ở mặt sau thẻ ôn (AC-04.1) và trang chi tiết từ (US-05).
export default function WordDetails({ word: card }: { word: WordContent }) {
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
