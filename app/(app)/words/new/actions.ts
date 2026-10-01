"use server";

import { createClient } from "@/lib/supabase/server";
import { todayVN } from "@/lib/date";
import { isPartOfSpeech, normalizeCollocations, TERM_MAX_LENGTH, type WordInput } from "@/lib/words";

export type FieldErrors = Partial<Record<"term" | "meaning_vi", string>>;

export type AddWordResult =
  | { ok: true; term: string }
  | { ok: false; fieldErrors?: FieldErrors; message?: string };

const duplicateMessage = (term: string) => `Từ "${term}" đã có trong kho.`;

// Thoát ký tự đặc biệt của ILIKE (% _ \) để so khớp đúng nguyên chữ
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

// AC-02.2: tìm từ trùng, không phân biệt hoa thường.
// RLS chỉ trả về từ của người đang đăng nhập, nên A không bị báo trùng với từ của B (AC-01.5).
async function findDuplicate(term: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("words")
    .select("term")
    .ilike("term", escapeLike(term))
    .limit(1)
    .maybeSingle();
  return data?.term ?? null;
}

// Gọi khi rời ô "Từ vựng": trả về câu cảnh báo nếu trùng, ngược lại null
export async function checkDuplicate(rawTerm: string): Promise<string | null> {
  const term = rawTerm.trim();
  if (!term) return null;
  const existing = await findDuplicate(term);
  return existing ? duplicateMessage(existing) : null;
}

export async function addWord(input: WordInput): Promise<AddWordResult> {
  const term = input.term.trim();
  const meaning = input.meaning_vi.trim();

  // AC-02.1: kiểm tra lại trên server, phòng trường hợp bỏ qua kiểm tra ở trình duyệt
  const fieldErrors: FieldErrors = {};
  if (!term) fieldErrors.term = "Vui lòng nhập từ vựng.";
  else if (term.length > TERM_MAX_LENGTH)
    fieldErrors.term = `Từ vựng tối đa ${TERM_MAX_LENGTH} ký tự.`;
  if (!meaning) fieldErrors.meaning_vi = "Vui lòng nhập nghĩa tiếng Việt.";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  // AC-02.2: kiểm tra trùng lần nữa khi bấm Lưu
  const existing = await findDuplicate(term);
  if (existing) return { ok: false, fieldErrors: { term: duplicateMessage(existing) } };

  const optional = (value: string) => value.trim() || null;
  const supabase = await createClient();
  // Không truyền user_id: cột có default auth.uid() (RLS)
  const { error } = await supabase.from("words").insert({
    term,
    meaning_vi: meaning,
    part_of_speech: isPartOfSpeech(input.part_of_speech) ? input.part_of_speech : null,
    example: optional(input.example),
    collocations: normalizeCollocations(input.collocations),
    definition_en: optional(input.definition_en),
    notes: optional(input.notes),
    // AC-02.3 + BR-00: đến hạn ôn ngay hôm nay theo giờ Việt Nam.
    // ease_factor 2.5, interval_days 0, repetitions 0 lấy theo default của database (mục 4.2)
    due_date: todayVN(),
  });

  if (error) {
    // 23505 = vi phạm chỉ mục chống trùng words_user_term_unique (hai lần lưu gần như cùng lúc)
    if (error.code === "23505") {
      return { ok: false, fieldErrors: { term: duplicateMessage(term) } };
    }
    console.error("addWord:", error);
    return { ok: false, message: "Không lưu được từ. Vui lòng thử lại." };
  }

  return { ok: true, term };
}
