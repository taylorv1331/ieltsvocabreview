"use server";

import { createClient } from "@/lib/supabase/server";
import { todayVN } from "@/lib/date";
import { isRating, schedule } from "@/lib/srs";

export type RateResult = { ok: true } | { ok: false; message: string };

const FAILED: RateResult = { ok: false, message: "Không lưu được kết quả. Vui lòng thử lại." };

// AC-04.2: tính lịch ôn mới theo BR-01 → BR-05 và ghi một dòng vào reviews
export async function rateWord(wordId: string, rating: number): Promise<RateResult> {
  if (!isRating(rating)) return FAILED;

  const supabase = await createClient();

  // Đọc trạng thái hiện tại từ database (không tin dữ liệu trình duyệt gửi lên)
  const { data: word, error: readError } = await supabase
    .from("words")
    .select("ease_factor, interval_days, repetitions")
    .eq("id", wordId)
    .single();
  if (readError || !word) {
    console.error("rateWord/read:", readError);
    return FAILED;
  }

  // Thuật toán SRS tính ở lib/srs.ts (hàm thuần, có unit test); BR-00: "hôm nay" theo giờ Việt Nam
  const next = schedule(
    {
      ease_factor: Number(word.ease_factor),
      interval_days: word.interval_days,
      repetitions: word.repetitions,
    },
    rating,
    todayVN(),
  );

  // Hàm Postgres rate_word (docs/schema.sql mục 10) cập nhật words VÀ ghi reviews
  // trong cùng một giao dịch: cả hai cùng thành công hoặc cùng huỷ.
  const { error } = await supabase.rpc("rate_word", {
    p_word_id: wordId,
    p_rating: rating,
    p_ease_factor: next.ease_factor,
    p_interval_days: next.interval_days,
    p_repetitions: next.repetitions,
    p_due_date: next.due_date,
  });
  if (error) {
    console.error("rateWord/rpc:", error);
    return FAILED;
  }

  return { ok: true };
}
