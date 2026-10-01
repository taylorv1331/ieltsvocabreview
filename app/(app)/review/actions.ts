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

  const before = {
    ease_factor: Number(word.ease_factor),
    interval_days: word.interval_days,
    repetitions: word.repetitions,
  };
  // BR-00: "hôm nay" theo giờ Việt Nam
  const next = schedule(before, rating, todayVN());

  const { error: updateError } = await supabase.from("words").update(next).eq("id", wordId);
  if (updateError) {
    console.error("rateWord/update:", updateError);
    return FAILED;
  }

  // Nhật ký ôn (chỉ ghi thêm). user_id có default auth.uid()
  const { error: logError } = await supabase.from("reviews").insert({
    word_id: wordId,
    rating,
    interval_before: before.interval_days,
    interval_after: next.interval_days,
  });
  if (logError) {
    // Lịch ôn đã cập nhật; chỉ thiếu một dòng lịch sử → ghi lỗi để kiểm tra, không chặn người học
    console.error("rateWord/log:", logError);
  }

  return { ok: true };
}
