"use server";

import { createClient } from "@/lib/supabase/server";
import { todayVN } from "@/lib/date";
import { isPartOfSpeech, normalizeCollocations, TERM_MAX_LENGTH, type WordInput } from "@/lib/words";

export type FieldErrors = Partial<Record<"term" | "meaning_vi", string>>;

export type SaveWordResult =
  | { ok: true; id: string; term: string }
  | { ok: false; fieldErrors?: FieldErrors; message?: string };

export type DeleteWordResult = { ok: true; term: string } | { ok: false; message: string };

const duplicateMessage = (term: string) => `Từ "${term}" đã có trong kho.`;

// Thoát ký tự đặc biệt của ILIKE (% _ \) để so khớp đúng nguyên chữ
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

// AC-02.2: tìm từ trùng, không phân biệt hoa thường.
// `excludeId`: khi sửa, bỏ qua chính từ đang sửa (đổi "mitigate" → "Mitigate" vẫn được).
// RLS chỉ trả về từ của người đang đăng nhập, nên A không bị báo trùng với từ của B (AC-01.5).
async function findDuplicate(term: string, excludeId?: string): Promise<string | null> {
  const supabase = await createClient();
  let query = supabase.from("words").select("term").ilike("term", escapeLike(term));
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.limit(1).maybeSingle();
  return data?.term ?? null;
}

// Gọi khi rời ô "Từ vựng": trả về câu cảnh báo nếu trùng, ngược lại null
export async function checkDuplicate(rawTerm: string, excludeId?: string): Promise<string | null> {
  const term = rawTerm.trim();
  if (!term) return null;
  const existing = await findDuplicate(term, excludeId);
  return existing ? duplicateMessage(existing) : null;
}

// Kiểm tra + chuẩn hoá nội dung từ (dùng chung cho thêm và sửa)
function validate(input: WordInput) {
  const term = input.term.trim();
  const meaning = input.meaning_vi.trim();

  // AC-02.1: kiểm tra lại trên server, phòng trường hợp bỏ qua kiểm tra ở trình duyệt
  const fieldErrors: FieldErrors = {};
  if (!term) fieldErrors.term = "Vui lòng nhập từ vựng.";
  else if (term.length > TERM_MAX_LENGTH)
    fieldErrors.term = `Từ vựng tối đa ${TERM_MAX_LENGTH} ký tự.`;
  if (!meaning) fieldErrors.meaning_vi = "Vui lòng nhập nghĩa tiếng Việt.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const optional = (value: string) => value.trim() || null;
  // Chỉ các cột NỘI DUNG — không có cột SRS
  const content = {
    term,
    meaning_vi: meaning,
    part_of_speech: isPartOfSpeech(input.part_of_speech) ? input.part_of_speech : null,
    example: optional(input.example),
    collocations: normalizeCollocations(input.collocations),
    definition_en: optional(input.definition_en),
    notes: optional(input.notes),
  };
  return { content };
}

export async function addWord(input: WordInput): Promise<SaveWordResult> {
  const { content, fieldErrors } = validate(input);
  if (!content) return { ok: false, fieldErrors };

  // AC-02.2: kiểm tra trùng lần nữa khi bấm Lưu
  const existing = await findDuplicate(content.term);
  if (existing) return { ok: false, fieldErrors: { term: duplicateMessage(existing) } };

  const supabase = await createClient();
  // Không truyền user_id: cột có default auth.uid() (RLS)
  const { data, error } = await supabase
    .from("words")
    .insert({
      ...content,
      // AC-02.3 + BR-00: đến hạn ôn ngay hôm nay theo giờ Việt Nam.
      // ease_factor 2.5, interval_days 0, repetitions 0 lấy theo default của database (mục 4.2)
      due_date: todayVN(),
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = vi phạm chỉ mục chống trùng words_user_term_unique (hai lần lưu gần như cùng lúc)
    if (error.code === "23505") {
      return { ok: false, fieldErrors: { term: duplicateMessage(content.term) } };
    }
    console.error("addWord:", error);
    return { ok: false, message: "Không lưu được từ. Vui lòng thử lại." };
  }

  return { ok: true, id: data.id, term: content.term };
}

// AC-05.1: sửa nội dung, trạng thái SRS giữ nguyên
export async function updateWord(id: string, input: WordInput): Promise<SaveWordResult> {
  const { content, fieldErrors } = validate(input);
  if (!content) return { ok: false, fieldErrors };

  // AC-02.2 áp dụng cả khi sửa, trừ chính từ đang sửa
  const existing = await findDuplicate(content.term, id);
  if (existing) return { ok: false, fieldErrors: { term: duplicateMessage(existing) } };

  const supabase = await createClient();
  // Chỉ cập nhật cột nội dung; ease_factor, interval_days, repetitions, due_date không đụng tới
  const { data, error } = await supabase
    .from("words")
    .update(content)
    .eq("id", id)
    .select("id");

  if (error) {
    if (error.code === "23505") {
      return { ok: false, fieldErrors: { term: duplicateMessage(content.term) } };
    }
    console.error("updateWord:", error);
    return { ok: false, message: "Không lưu được thay đổi. Vui lòng thử lại." };
  }
  // RLS: từ không phải của mình (hoặc đã bị xoá) → không có dòng nào được cập nhật
  if (!data?.length) return { ok: false, message: "Không tìm thấy từ này. Có thể từ đã bị xoá." };

  return { ok: true, id, term: content.term };
}

// AC-05.2: xoá từ. Database tự xoá word_topics (cascade) và giữ reviews với word_id = null
// (docs/schema.sql mục 12) để thống kê và streak không thay đổi.
export async function deleteWord(id: string): Promise<DeleteWordResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("words").delete().eq("id", id).select("term");

  if (error) {
    console.error("deleteWord:", error);
    return { ok: false, message: "Không xoá được từ. Vui lòng thử lại." };
  }
  if (!data?.length) return { ok: false, message: "Không tìm thấy từ này. Có thể từ đã bị xoá." };

  return { ok: true, term: data[0].term };
}
