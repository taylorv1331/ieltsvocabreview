// Từ loại: giá trị khớp ràng buộc check của cột word_senses.part_of_speech trong docs/schema.sql
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

export function partOfSpeechLabel(value: string | null): string | undefined {
  return PARTS_OF_SPEECH.find((p) => p.value === value)?.label;
}

export const TERM_MAX_LENGTH = 100;
// BR-14: mỗi từ có 1–3 nghĩa
export const MAX_SENSES = 3;

// ---------- Dữ liệu form (chuỗi thô, chưa chuẩn hoá) ----------

// Một khối nghĩa trong form
export type SenseInput = {
  part_of_speech: string;
  meaning_vi: string;
  definition_en: string;
  example: string;
  collocations: string;
  notes: string;
};

export type WordInput = {
  term: string;
  dictionary_url: string;
  senses: SenseInput[]; // 1–3 khối, theo thứ tự trên form
};

export const EMPTY_SENSE: SenseInput = {
  part_of_speech: "",
  meaning_vi: "",
  definition_en: "",
  example: "",
  collocations: "",
  notes: "",
};

// Khối nghĩa trống hoàn toàn (mọi ô đều trống) — AC-02.4: khối 2/3 trống thì bỏ qua khi lưu
export function isSenseEmpty(sense: SenseInput): boolean {
  return Object.values(sense).every((v) => !v.trim());
}

// ---------- Dữ liệu từ database (để hiển thị) ----------

export type SenseContent = {
  sort_order: number;
  part_of_speech: string | null;
  meaning_vi: string;
  definition_en: string | null;
  example: string | null;
  collocations: string | null;
  notes: string | null;
};

// Nội dung một từ (không gồm trạng thái SRS) — dùng ở thẻ đáp án và trang chi tiết
export type WordContent = {
  term: string;
  dictionary_url: string | null;
  senses: SenseContent[];
};

// Cột cần select từ Supabase để có đủ nội dung một từ (kèm các nghĩa qua quan hệ word_senses)
export const WORD_CONTENT_SELECT =
  "term, dictionary_url, word_senses(sort_order, part_of_speech, meaning_vi, definition_en, example, collocations, notes)";

// Dòng Supabase trả về (word_senses lồng bên trong) → WordContent, nghĩa xếp theo sort_order
export function toWordContent(row: {
  term: string;
  dictionary_url: string | null;
  word_senses: SenseContent[] | null;
}): WordContent {
  return {
    term: row.term,
    dictionary_url: row.dictionary_url,
    senses: [...(row.word_senses ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

// Dữ liệu từ database → giá trị ban đầu của form sửa
export function toWordInput(word: WordContent): WordInput {
  return {
    term: word.term,
    dictionary_url: word.dictionary_url ?? "",
    senses: word.senses.map((s) => ({
      part_of_speech: s.part_of_speech ?? "",
      meaning_vi: s.meaning_vi,
      definition_en: s.definition_en ?? "",
      example: s.example ?? "",
      collocations: collocationsToLines(s.collocations),
      notes: s.notes ?? "",
    })),
  };
}

// BR-14: dòng trong Kho từ hiện các nghĩa nối bằng " · "
export function meaningsSummary(senses: { meaning_vi: string }[]): string {
  return senses.map((s) => s.meaning_vi).join(" · ");
}

// ---------- Collocation ----------

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

// ---------- Link từ điển ----------

// AC-02.5: chỉ nhận link bắt đầu bằng http:// hoặc https:// (chặn kiểu "javascript:...")
export function isHttpUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

// AC-02.5: "Look Up" → https://dictionary.cambridge.org/dictionary/english/look-up
export function cambridgeUrl(term: string): string {
  const slug = term.trim().toLowerCase().replace(/\s+/g, "-");
  return `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(slug)}`;
}

// ---------- Hiển thị từ rất dài ----------

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
      for (let i = 0; i < word.length; i += CHUNK) parts.push(word.slice(i, i + CHUNK));
      // Chừa ít nhất 3 chữ ở cuối để dòng sau không chỉ còn 1–2 chữ
      if (parts.length > 1 && parts[parts.length - 1].length < 3) {
        const last = parts.pop()!;
        parts[parts.length - 1] += last;
      }
      return parts.join(SOFT_HYPHEN);
    })
    .join(" ");
}

// ---------- Kiểm tra form (dùng chung cho trình duyệt và server) ----------

export type FieldErrors = {
  term?: string;
  dictionary_url?: string;
  // Lỗi "Nghĩa tiếng Việt" theo vị trí khối trên form (0 = khối 1)
  senses?: Record<number, string>;
};

// Dữ liệu đã chuẩn hoá, sẵn sàng gửi cho hàm save_word (chuỗi rỗng = không có)
export type SenseToSave = {
  part_of_speech: string;
  meaning_vi: string;
  definition_en: string;
  example: string;
  collocations: string;
  notes: string;
};
export type WordToSave = { term: string; dictionary_url: string | null; senses: SenseToSave[] };

export function validateWordInput(
  input: WordInput,
): { ok: true; word: WordToSave } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const term = input.term.trim();

  // AC-02.1: "Từ vựng" bắt buộc
  if (!term) errors.term = "Vui lòng nhập từ vựng.";
  else if (term.length > TERM_MAX_LENGTH) errors.term = `Từ vựng tối đa ${TERM_MAX_LENGTH} ký tự.`;

  // AC-02.5: link không bắt buộc, nhưng có thì phải là http(s)
  const url = input.dictionary_url.trim();
  if (url && !isHttpUrl(url)) {
    errors.dictionary_url = "Link phải bắt đầu bằng http:// hoặc https://";
  }

  const senses: SenseToSave[] = [];
  const senseErrors: Record<number, string> = {};
  input.senses.slice(0, MAX_SENSES).forEach((sense, index) => {
    // AC-02.4: khối 2/3 trống hoàn toàn → bỏ qua
    if (index > 0 && isSenseEmpty(sense)) return;
    // AC-02.1: khối 1, hoặc khối 2/3 đã nhập ô khác → bắt buộc có nghĩa tiếng Việt
    if (!sense.meaning_vi.trim()) {
      senseErrors[index] = "Vui lòng nhập nghĩa tiếng Việt.";
      return;
    }
    senses.push({
      part_of_speech: isPartOfSpeech(sense.part_of_speech) ? sense.part_of_speech : "",
      meaning_vi: sense.meaning_vi.trim(),
      definition_en: sense.definition_en.trim(),
      example: sense.example.trim(),
      collocations: normalizeCollocations(sense.collocations) ?? "",
      notes: sense.notes.trim(),
    });
  });
  if (Object.keys(senseErrors).length) errors.senses = senseErrors;

  if (errors.term || errors.dictionary_url || errors.senses) return { ok: false, errors };
  return { ok: true, word: { term, dictionary_url: url || null, senses } };
}
