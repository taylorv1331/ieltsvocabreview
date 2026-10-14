"use server";

import { createClient } from "@/lib/supabase/server";
import { todayVN } from "@/lib/date";
import { validateWordInput, type FieldErrors, type WordInput } from "@/lib/words";

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

// Thêm (wordId rỗng) hoặc sửa từ cùng các nghĩa.
// Hàm Postgres save_word (docs/schema.sql mục 14e) ghi words + word_senses trong MỘT giao dịch.
async function saveWord(wordId: string | null, input: WordInput): Promise<SaveWordResult> {
  // AC-02.1, AC-02.4, AC-02.5: kiểm tra lại trên server, phòng trường hợp bỏ qua kiểm tra ở trình duyệt
  const checked = validateWordInput(input);
  if (!checked.ok) return { ok: false, fieldErrors: checked.errors };
  const word = checked.word;

  // AC-02.2: kiểm tra trùng lần nữa khi bấm Lưu (khi sửa thì trừ chính nó)
  const existing = await findDuplicate(word.term, wordId ?? undefined);
  if (existing) return { ok: false, fieldErrors: { term: duplicateMessage(existing) } };

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("save_word", {
    p_word_id: wordId,
    p_term: word.term,
    p_dictionary_url: word.dictionary_url,
    p_senses: word.senses,
    // AC-02.3 + BR-00: từ mới đến hạn ôn ngay hôm nay theo giờ Việt Nam (khi sửa thì không dùng)
    p_due_date: todayVN(),
  });

  if (error) {
    // 23505 = vi phạm chỉ mục chống trùng words_user_term_unique (hai lần lưu gần như cùng lúc)
    if (error.code === "23505") {
      return { ok: false, fieldErrors: { term: duplicateMessage(word.term) } };
    }
    console.error("saveWord:", error);
    // Từ không phải của mình (RLS) hoặc đã bị xoá → save_word báo "Không tìm thấy từ"
    if (error.message.includes("Không tìm thấy từ")) {
      return { ok: false, message: "Không tìm thấy từ này. Có thể từ đã bị xoá." };
    }
    return { ok: false, message: "Không lưu được từ. Vui lòng thử lại." };
  }

  return { ok: true, id: id as string, term: word.term };
}

export async function addWord(input: WordInput): Promise<SaveWordResult> {
  return saveWord(null, input);
}

// AC-05.1: sửa nội dung (kể cả các nghĩa và link), trạng thái SRS giữ nguyên
export async function updateWord(id: string, input: WordInput): Promise<SaveWordResult> {
  return saveWord(id, input);
}

// AC-05.2: xoá từ. Database tự chép từ (kể cả các nghĩa) sang deleted_words trước khi xoá
// (docs/schema.sql mục 13, 14d), xoá word_senses + word_topics, và giữ nguyên lịch sử ôn.
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
