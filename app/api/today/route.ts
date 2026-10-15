import { todayVN } from "@/lib/date";

// API trình diễn BR-00 (Swagger: /api-docs): "hôm nay" tính theo giờ Việt Nam,
// trong khi server Vercel chạy giờ UTC.
export const dynamic = "force-dynamic";

export function GET() {
  const now = new Date();
  return Response.json({
    today_vn: todayVN(now),
    time_zone: "Asia/Ho_Chi_Minh",
    server_time_utc: now.toISOString(),
    server_date_utc: now.toISOString().slice(0, 10),
  });
}
