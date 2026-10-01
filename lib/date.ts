// BR-00: "hôm nay" luôn tính theo giờ Việt Nam, không theo giờ của server (UTC) hay database.
const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

// Trả về ngày hôm nay theo giờ Việt Nam, dạng "YYYY-MM-DD" (đúng định dạng cột date của Postgres).
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
