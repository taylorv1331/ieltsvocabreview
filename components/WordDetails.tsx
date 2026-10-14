import { ExternalLink } from "lucide-react";
import {
  isHttpUrl,
  partOfSpeechLabel,
  softHyphenate,
  type SenseContent,
  type WordContent,
} from "@/lib/words";

// Hiện mọi thông tin của một từ: link từ điển + các khối nghĩa theo thứ tự, ô trống thì ẩn.
// Dùng ở mặt sau thẻ ôn (AC-04.1) và trang chi tiết từ (US-05).
export default function WordDetails({ word }: { word: WordContent }) {
  const many = word.senses.length > 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p lang="en" className="term-wrap text-2xl font-bold">
          {softHyphenate(word.term)}
        </p>
        {/* AC-02.5 / BR-14: link mở trang ngoài trong tab mới (chỉ http/https) */}
        {word.dictionary_url && isHttpUrl(word.dictionary_url) && (
          <a
            href={word.dictionary_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-medium text-pink-700 underline-offset-2 md:hover:underline"
          >
            <ExternalLink aria-hidden size={16} />
            Nghe phát âm và xem thêm
          </a>
        )}
      </div>

      {word.senses.map((sense, index) => (
        <Sense key={sense.sort_order} sense={sense} number={many ? index + 1 : undefined} />
      ))}
    </div>
  );
}

// Một khối nghĩa; có nhiều nghĩa thì đánh số 1, 2, 3 và kẻ vạch ngăn cách
function Sense({ sense, number }: { sense: SenseContent; number?: number }) {
  const pos = partOfSpeechLabel(sense.part_of_speech);
  const collocations = sense.collocations
    ?.split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section className={`flex flex-col gap-3 ${number && number > 1 ? "border-t border-slate-200 pt-4" : ""}`}>
      {(number || pos) && (
        <p className="text-sm font-semibold text-pink-700">
          {number ? `${number}. ` : ""}
          {pos ?? ""}
        </p>
      )}
      <p className="text-lg">{sense.meaning_vi}</p>
      {sense.definition_en && <p className="text-slate-600 italic">{sense.definition_en}</p>}
      {sense.example && (
        <Detail label="Ví dụ">
          <p>{sense.example}</p>
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
      {sense.notes && (
        <Detail label="Ghi chú">
          <p className="whitespace-pre-line">{sense.notes}</p>
        </Detail>
      )}
    </section>
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
