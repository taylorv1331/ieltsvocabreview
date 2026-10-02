import { addDays } from "./date";

// Thuật toán SRS (SM-2 rút gọn) — docs/requirements.md mục 4.2, BR-01 → BR-05.
// Hàm thuần: không đọc/ghi database, chỉ nhận trạng thái cũ + rating, trả về trạng thái mới.

export type Rating = 0 | 1 | 2 | 3; // 0 Quên, 1 Khó, 2 Nhớ, 3 Dễ

export const RATINGS: { value: Rating; label: string }[] = [
  { value: 0, label: "Quên" },
  { value: 1, label: "Khó" },
  { value: 2, label: "Nhớ" },
  { value: 3, label: "Dễ" },
];

export function isRating(value: unknown): value is Rating {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

export type SrsState = {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
};

export type SrsResult = SrsState & { due_date: string };

export const MIN_EASE = 1.3;

// ease_factor lưu numeric(4,2) → làm tròn 2 chữ số để tránh sai số kiểu 2.1499999
const round2 = (n: number) => Math.round(n * 100) / 100;

export function schedule(state: SrsState, rating: Rating, today: string): SrsResult {
  const { ease_factor: ease, interval_days: interval, repetitions: reps } = state;

  // Khoảng ôn kiểu "Nhớ" (chưa làm tròn) — BR-03:
  // lần đầu 1 ngày; lần hai max(3, khoảng cũ) để không co lại sau khi bấm Dễ lần đầu (4 ngày);
  // từ lần ba trở đi = khoảng cũ × ease_factor
  const goodInterval = reps === 0 ? 1 : reps === 1 ? Math.max(3, interval) : interval * ease;

  let nextInterval: number;
  let nextEase: number;
  let nextReps: number;

  switch (rating) {
    case 0: // BR-01: Quên → 0 ngày (ôn lại cuối phiên hôm nay), ease − 0.20, repetitions về 0
      nextInterval = 0;
      nextEase = ease - 0.2;
      nextReps = 0;
      break;
    case 1: // BR-02: Khó → khoảng cũ × 1.2, tối thiểu 1 ngày; ease − 0.15
      nextInterval = Math.max(1, Math.round(interval * 1.2));
      nextEase = ease - 0.15;
      nextReps = reps + 1;
      break;
    case 2: // BR-03: Nhớ → giữ nguyên ease
      nextInterval = Math.round(goodInterval);
      nextEase = ease;
      nextReps = reps + 1;
      break;
    case 3: // BR-04: Dễ → như Nhớ rồi × 1.3 (dùng ease cũ, làm tròn 1 lần); lần đầu là 4 ngày; ease + 0.15
      nextInterval = reps === 0 ? 4 : Math.round(goodInterval * 1.3);
      nextEase = ease + 0.15;
      nextReps = reps + 1;
      break;
  }

  return {
    // BR-05: ease_factor kẹp tối thiểu 1.3
    ease_factor: Math.max(MIN_EASE, round2(nextEase)),
    interval_days: nextInterval,
    repetitions: nextReps,
    // BR-05: due_date = hôm nay + khoảng ôn mới (hôm nay theo giờ Việt Nam, BR-00)
    due_date: addDays(today, nextInterval),
  };
}
