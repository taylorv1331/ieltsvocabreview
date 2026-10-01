import type { SupabaseClient } from "@supabase/supabase-js";

// Một thẻ ôn: đủ thông tin để hiện mặt trước (term) và mặt sau (AC-04.1)
export type DueWord = {
  id: string;
  term: string;
  part_of_speech: string | null;
  meaning_vi: string;
  definition_en: string | null;
  example: string | null;
  collocations: string | null;
  notes: string | null;
  due_date: string;
};

const DUE_WORD_COLUMNS =
  "id, term, part_of_speech, meaning_vi, definition_en, example, collocations, notes, due_date";

// AC-03.1: các từ có ngày ôn ≤ hôm nay.
// Quá hạn lâu nhất lên trước (due_date tăng dần); cùng ngày thì từ thêm trước ôn trước (created_at).
// `today` phải lấy từ todayVN() (BR-00), không dùng current_date của database.
// RLS chỉ trả về từ của người đang đăng nhập.
export async function getDueWords(supabase: SupabaseClient, today: string): Promise<DueWord[]> {
  const { data, error } = await supabase
    .from("words")
    .select(DUE_WORD_COLUMNS)
    .lte("due_date", today)
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

// AC-03.2: ngày ôn kế tiếp = due_date nhỏ nhất sau hôm nay; null nếu không còn từ nào phía sau
export async function getNextDueDate(supabase: SupabaseClient, today: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("words")
    .select("due_date")
    .gt("due_date", today)
    .order("due_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.due_date ?? null;
}
