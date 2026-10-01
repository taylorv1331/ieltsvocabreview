// BR-00: "hôm nay" luôn tính theo giờ Việt Nam, không theo giờ của server (UTC) hay database.
// Mọi ngày trong app là chuỗi "YYYY-MM-DD" (đúng định dạng cột date của Postgres).
const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Trả về ngày hôm nay theo giờ Việt Nam.
// Tham số `now` để unit test truyền thời điểm tuỳ ý.
export function todayVN(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// Đổi "YYYY-MM-DD" sang số mili-giây (tính theo UTC để không bị lệch múi giờ)
function toUtcMs(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

// Cộng (hoặc trừ, nếu days âm) số ngày vào một ngày
export function addDays(date: string, days: number): string {
  return new Date(toUtcMs(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

// Số ngày từ `from` tới `to` (dương nếu `to` ở sau `from`)
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

// "2026-10-02" → "02/10/2026"
export function formatDateVN(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}
