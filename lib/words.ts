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
