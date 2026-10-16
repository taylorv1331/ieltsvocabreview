import { missingSenses, readJson, toWordInputFromJson } from "@/lib/api";
import { validateWordInput } from "@/lib/words";

// API trình diễn business logic (Swagger: /api-docs). KHÔNG đọc / ghi dữ liệu.
// Gọi đúng hàm validateWordInput() mà form Thêm/Sửa từ và server đang dùng (AC-02.1, AC-02.4, AC-02.5).
export async function POST(request: Request) {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const input = toWordInputFromJson(parsed.body);
  if (!input) return missingSenses();

  const result = validateWordInput(input);
  return Response.json(
    result.ok ? { valid: true, will_save: result.word } : { valid: false, errors: result.errors },
  );
}
