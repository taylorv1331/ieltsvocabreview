import { todayVN } from "@/lib/date";
import { isRating, MIN_EASE, schedule } from "@/lib/srs";

// API trình diễn business logic (Swagger: /api-docs). KHÔNG ghi dữ liệu.
// Gọi đúng hàm schedule() mà phiên ôn đang dùng (BR-01 → BR-05) — không viết lại logic.

const RULE_BY_RATING = {
  0: "BR-01 (Quên): khoảng ôn 0 ngày, ease − 0.20, repetitions về 0",
  1: "BR-02 (Khó): khoảng cũ × 1.2 (tối thiểu 1 ngày), ease − 0.15",
  2: "BR-03 (Nhớ): lần 1 → 1 ngày, lần 2 → max(3, khoảng cũ), từ lần 3 → khoảng cũ × ease",
  3: "BR-04 (Dễ): như Nhớ rồi × 1.3 (lần đầu 4 ngày), ease + 0.15",
} as const;

const isNonNegativeInt = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ errors: ["Nội dung gửi lên phải là JSON."] }, { status: 400 });
  }

  const { ease_factor, interval_days, repetitions, rating, today } = body;
  const errors: string[] = [];
  if (typeof ease_factor !== "number" || ease_factor < MIN_EASE || ease_factor > 9.99)
    errors.push(`ease_factor phải là số từ ${MIN_EASE} đến 9.99.`);
  if (!isNonNegativeInt(interval_days)) errors.push("interval_days phải là số nguyên ≥ 0.");
  if (!isNonNegativeInt(repetitions)) errors.push("repetitions phải là số nguyên ≥ 0.");
  if (!isRating(rating)) errors.push("rating phải là 0 (Quên), 1 (Khó), 2 (Nhớ) hoặc 3 (Dễ).");
  if (today !== undefined && (typeof today !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(today)))
    errors.push("today (không bắt buộc) phải có dạng YYYY-MM-DD.");
  if (errors.length) return Response.json({ errors }, { status: 400 });

  // BR-00: không truyền today thì lấy hôm nay theo giờ Việt Nam
  const day = (today as string | undefined) ?? todayVN();
  const state = {
    ease_factor: ease_factor as number,
    interval_days: interval_days as number,
    repetitions: repetitions as number,
  };
  const r = rating as 0 | 1 | 2 | 3;

  return Response.json({
    today: day,
    before: state,
    rating: r,
    rule: RULE_BY_RATING[r],
    after: schedule(state, r, day),
    note: "BR-05: due_date = today + interval_days mới; khoảng ôn làm tròn Math.round; ease không thấp hơn 1.3",
  });
}
