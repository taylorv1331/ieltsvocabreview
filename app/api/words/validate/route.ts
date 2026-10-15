import { validateWordInput, type SenseInput, type WordInput } from "@/lib/words";

// API trình diễn business logic (Swagger: /api-docs). KHÔNG ghi dữ liệu.
// Gọi đúng hàm validateWordInput() mà form Thêm/Sửa từ và server đang dùng (AC-02.1, AC-02.4, AC-02.5).

const str = (v: unknown) => (typeof v === "string" ? v : "");

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ errors: ["Nội dung gửi lên phải là JSON."] }, { status: 400 });
  }
  if (!Array.isArray(body.senses) || body.senses.length === 0) {
    return Response.json({ errors: ["senses phải là mảng có 1–3 khối nghĩa."] }, { status: 400 });
  }

  // Ô thiếu thì coi như chuỗi rỗng, giống form trên giao diện
  const input: WordInput = {
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

  const result = validateWordInput(input);
  return Response.json(
    result.ok
      ? { valid: true, will_save: result.word }
      : { valid: false, errors: result.errors },
  );
}
