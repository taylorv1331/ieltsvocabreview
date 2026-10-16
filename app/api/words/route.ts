import { createClient } from "@/lib/supabase/server";
import { missingSenses, readJson, requireUser, toWordInputFromJson } from "@/lib/api";
import { meaningsSummary } from "@/lib/words";
import { addWord } from "@/app/(app)/words/actions";

// API Kho từ — CẦN ĐĂNG NHẬP (cookie của app ở cùng trình duyệt). RLS: chỉ thấy / ghi từ của mình.

// GET /api/words — danh sách từ, mới thêm lên đầu (giống trang Kho từ)
export async function GET() {
  const supabase = await createClient();
  const denied = await requireUser(supabase);
  if (denied) return denied;

  const { data, error } = await supabase
    .from("words")
    .select("id, term, due_date, word_senses(sort_order, meaning_vi)")
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: "Không đọc được kho từ." }, { status: 500 });

  return Response.json({
    count: data.length,
    words: data.map((w) => ({
      id: w.id,
      term: w.term,
      // BR-14: các nghĩa nối bằng " · "
      meanings: meaningsSummary([...w.word_senses].sort((a, b) => a.sort_order - b.sort_order)),
      due_date: w.due_date,
    })),
  });
}

// POST /api/words — thêm từ (US-02): cùng hàm addWord() với form Thêm từ
export async function POST(request: Request) {
  const supabase = await createClient();
  const denied = await requireUser(supabase);
  if (denied) return denied;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const input = toWordInputFromJson(parsed.body);
  if (!input) return missingSenses();

  const result = await addWord(input);
  if (!result.ok) {
    // AC-02.1 / 02.2 / 02.4 / 02.5: lỗi theo từng ô → 422
    if (result.fieldErrors) return Response.json({ errors: result.fieldErrors }, { status: 422 });
    return Response.json({ error: result.message }, { status: 500 });
  }
  return Response.json({ id: result.id, term: result.term }, { status: 201 });
}
