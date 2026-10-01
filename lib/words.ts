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
