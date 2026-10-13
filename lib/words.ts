// Từ loại: giá trị khớp ràng buộc check của cột words.part_of_speech trong docs/schema.sql
export const PARTS_OF_SPEECH = [
  { value: "noun", label: "Danh từ" },
  { value: "verb", label: "Động từ" },
  { value: "adjective", label: "Tính từ" },
  { value: "adverb", label: "Trạng từ" },
  { value: "phrase", label: "Cụm từ" },
  { value: "other", label: "Khác" },
] as const;

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number]["value"];

export function isPartOfSpeech(value: string): value is PartOfSpeech {
  return PARTS_OF_SPEECH.some((p) => p.value === value);
}

export const TERM_MAX_LENGTH = 100;

// Dữ liệu form "Thêm từ" (chưa chuẩn hoá)
export type WordInput = {
  term: string;
  meaning_vi: string;
  part_of_speech: string;
  example: string;
  collocations: string;
  definition_en: string;
  notes: string;
};

// Tách collocation theo dòng hoặc dấu ";", bỏ khoảng trắng thừa và giá trị rỗng,
// rồi nối lại bằng "; " — cùng định dạng với BR-11 khi nhập CSV.
export function normalizeCollocations(raw: string): string | null {
  const items = raw
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items.join("; ") : null;
}

// Ngược lại với normalizeCollocations: "a; b" → mỗi collocation một dòng (để hiện trong form sửa)
export function collocationsToLines(stored: string | null): string {
  return stored ? stored.split(";").map((s) => s.trim()).filter(Boolean).join("\n") : "";
}

// Nội dung một từ (không gồm trạng thái SRS) — dùng để hiện thẻ đáp án và trang chi tiết
export type WordContent = {
  term: string;
  part_of_speech: string | null;
  meaning_vi: string;
  definition_en: string | null;
  example: string | null;
  collocations: string | null;
  notes: string | null;
};

// Dữ liệu từ database → giá trị ban đầu của form sửa
export function toWordInput(word: WordContent): WordInput {
  return {
    term: word.term,
    meaning_vi: word.meaning_vi,
    part_of_speech: word.part_of_speech ?? "",
    example: word.example ?? "",
    collocations: collocationsToLines(word.collocations),
    definition_en: word.definition_en ?? "",
    notes: word.notes ?? "",
  };
}

// Chèn "điểm ngắt mềm" (soft hyphen, U+00AD — ký tự vô hình) vào giữa các từ rất dài.
// Từ vừa một dòng: không thấy gì. Phải xuống dòng: trình duyệt ngắt ở đó và hiện dấu "-" cuối dòng,
// trên mọi trình duyệt (không phụ thuộc từ điển ngắt âm tiết). Chỉ dùng để HIỂN THỊ, không lưu vào database.
const SOFT_HYPHEN = "­";
const LONG_WORD = 14; // từ dài hơn ngần này ký tự mới chèn
const CHUNK = 6; // khoảng cách giữa các điểm ngắt

export function softHyphenate(text: string): string {
  return text
    .split(" ")
    .map((word) => {
      if (word.length <= LONG_WORD) return word;
      const parts: string[] = [];
      // Chừa ít nhất 3 chữ ở cuối để dòng sau không chỉ còn 1–2 chữ
      for (let i = 0; i < word.length; i += CHUNK) parts.push(word.slice(i, i + CHUNK));
      if (parts.length > 1 && parts[parts.length - 1].length < 3) {
        const last = parts.pop()!;
        parts[parts.length - 1] += last;
      }
      return parts.join(SOFT_HYPHEN);
    })
    .join(" ");
}
