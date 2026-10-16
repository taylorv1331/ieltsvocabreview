// Tiện ích dùng chung cho các API trong app/api (trình bày lớp business logic qua Swagger)
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SenseInput, WordInput } from "./words";

const str = (v: unknown) => (typeof v === "string" ? v : "");

// Đọc JSON gửi lên. Bắt buộc Content-Type: application/json — trình duyệt sẽ hỏi trước (CORS)
// khi một trang web lạ gửi kiểu dữ liệu này, nên trang lạ không lợi dụng được cookie đăng nhập.
export async function readJson(
  request: Request,
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; response: Response }> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return {
      ok: false,
      response: Response.json({ errors: ["Cần gửi kèm header Content-Type: application/json."] }, { status: 415 }),
    };
  }
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return { ok: true, body };
  } catch {
    // rơi xuống lỗi bên dưới
  }
  return { ok: false, response: Response.json({ errors: ["Nội dung gửi lên phải là JSON."] }, { status: 400 }) };
}

// JSON gửi lên → dữ liệu form (ô thiếu coi như chuỗi rỗng, giống form trên giao diện).
// null nếu thiếu mảng senses.
export function toWordInputFromJson(body: Record<string, unknown>): WordInput | null {
  if (!Array.isArray(body.senses) || body.senses.length === 0) return null;
  return {
    term: str(body.term),
    dictionary_url: str(body.dictionary_url),
    senses: (body.senses as Record<string, unknown>[]).map(
      (s): SenseInput => ({
        part_of_speech: str(s?.part_of_speech),
        meaning_vi: str(s?.meaning_vi),
        definition_en: str(s?.definition_en),
        example: str(s?.example),
        collocations: str(s?.collocations),
        notes: str(s?.notes),
      }),
    ),
  };
}

export const missingSenses = () =>
  Response.json({ errors: ["senses phải là mảng có 1–3 khối nghĩa."] }, { status: 400 });

// Kiểm tra đăng nhập ngay trong API (lớp bảo vệ thứ hai, sau proxy.ts)
export async function requireUser(supabase: SupabaseClient): Promise<Response | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ? null : Response.json({ error: "Bạn cần đăng nhập để dùng API này." }, { status: 401 });
}
