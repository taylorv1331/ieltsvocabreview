import { createClient } from "@/lib/supabase/server";
import { missingSenses, readJson, requireUser, toWordInputFromJson } from "@/lib/api";
import { toWordContent, WORD_CONTENT_SELECT } from "@/lib/words";
import { deleteWord, updateWord } from "@/app/(app)/words/actions";

// API một từ — CẦN ĐĂNG NHẬP. RLS: từ của người khác coi như không tồn tại (404).

type Ctx = { params: Promise<{ id: string }> };
const notFound = () => Response.json({ error: "Không tìm thấy từ này." }, { status: 404 });

// GET /api/words/{id} — chi tiết: các nghĩa, link từ điển và trạng thái SRS
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const denied = await requireUser(supabase);
  if (denied) return denied;

  const { data } = await supabase
    .from("words")
    .select(`id, ease_factor, interval_days, repetitions, due_date, created_at, updated_at, ${WORD_CONTENT_SELECT}`)
    .eq("id", id)
    .maybeSingle();
  if (!data) return notFound();

  return Response.json({
    id: data.id,
    ...toWordContent(data),
    srs: {
      ease_factor: Number(data.ease_factor),
      interval_days: data.interval_days,
      repetitions: data.repetitions,
      due_date: data.due_date,
    },
    created_at: data.created_at,
    updated_at: data.updated_at,
  });
}

// PUT /api/words/{id} — sửa từ (AC-05.1): nội dung đổi, trạng thái SRS giữ nguyên
export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const denied = await requireUser(supabase);
  if (denied) return denied;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const input = toWordInputFromJson(parsed.body);
  if (!input) return missingSenses();

  const result = await updateWord(id, input);
  if (!result.ok) {
    if (result.fieldErrors) return Response.json({ errors: result.fieldErrors }, { status: 422 });
    if (result.message?.includes("Không tìm thấy")) return notFound();
    return Response.json({ error: result.message }, { status: 500 });
  }
  return Response.json({ id: result.id, term: result.term });
}

// DELETE /api/words/{id} — xoá từ (AC-05.2): database tự chép vào deleted_words, giữ lịch sử ôn
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const denied = await requireUser(supabase);
  if (denied) return denied;

  const result = await deleteWord(id);
  if (!result.ok) {
    if (result.message.includes("Không tìm thấy")) return notFound();
    return Response.json({ error: result.message }, { status: 500 });
  }
  return Response.json({ deleted: result.term, archived_to: "deleted_words" });
}
