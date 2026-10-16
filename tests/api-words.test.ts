import { beforeEach, describe, expect, it, vi } from "vitest";

// Giả lập Supabase và các hàm thêm / sửa / xoá để test được API mà không cần database thật
const state = vi.hoisted(() => ({ user: null as null | { id: string } }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: () => ({
      select: () => ({
        order: async () => ({
          data: [
            {
              id: "w1",
              term: "long",
              due_date: "2026-10-16",
              word_senses: [
                { sort_order: 2, meaning_vi: "mong mỏi" },
                { sort_order: 1, meaning_vi: "dài" },
              ],
            },
          ],
          error: null,
        }),
        eq: () => ({ maybeSingle: async () => ({ data: null }) }),
      }),
    }),
  }),
}));

const actions = vi.hoisted(() => ({
  addWord: vi.fn(),
  updateWord: vi.fn(),
  deleteWord: vi.fn(),
}));
vi.mock("@/app/(app)/words/actions", () => actions);

import { GET as listWords, POST as createWord } from "../app/api/words/route";
import { DELETE as removeWord, GET as getWord, PUT as editWord } from "../app/api/words/[id]/route";

const ctx = { params: Promise.resolve({ id: "w1" }) };
const json = (body: unknown, contentType = "application/json") =>
  new Request("http://localhost/api/words", {
    method: "POST",
    headers: { "content-type": contentType },
    body: JSON.stringify(body),
  });
const word = { term: "long", senses: [{ meaning_vi: "dài" }] };

beforeEach(() => {
  state.user = null;
  vi.clearAllMocks();
});

describe("Chưa đăng nhập → 401 ở mọi API Kho từ", () => {
  it.each([
    ["GET /api/words", () => listWords()],
    ["POST /api/words", () => createWord(json(word))],
    ["GET /api/words/{id}", () => getWord(new Request("http://x"), ctx)],
    ["PUT /api/words/{id}", () => editWord(json(word), ctx)],
    ["DELETE /api/words/{id}", () => removeWord(new Request("http://x"), ctx)],
  ])("%s", async (_, call) => {
    const res = await call();
    expect(res.status).toBe(401);
    expect(actions.addWord).not.toHaveBeenCalled();
    expect(actions.updateWord).not.toHaveBeenCalled();
    expect(actions.deleteWord).not.toHaveBeenCalled();
  });
});

describe("Đã đăng nhập", () => {
  beforeEach(() => {
    state.user = { id: "user-a" };
  });

  it("GET /api/words: các nghĩa xếp đúng thứ tự, nối bằng \" · \" (BR-14)", async () => {
    const body = await (await listWords()).json();
    expect(body.count).toBe(1);
    expect(body.words[0].meanings).toBe("dài · mong mỏi");
  });

  it("GET /api/words/{id}: không có (hoặc không phải của mình) → 404", async () => {
    expect((await getWord(new Request("http://x"), ctx)).status).toBe(404);
  });

  it("POST: thiếu Content-Type JSON → 415, không gọi addWord", async () => {
    const res = await createWord(json(word, "text/plain"));
    expect(res.status).toBe(415);
    expect(actions.addWord).not.toHaveBeenCalled();
  });

  it("POST: hợp lệ → 201 và gọi đúng addWord()", async () => {
    actions.addWord.mockResolvedValue({ ok: true, id: "w2", term: "long" });
    const res = await createWord(json(word));
    expect(res.status).toBe(201);
    expect(actions.addWord).toHaveBeenCalledWith({
      term: "long",
      dictionary_url: "",
      senses: [{ part_of_speech: "", meaning_vi: "dài", definition_en: "", example: "", collocations: "", notes: "" }],
    });
  });

  it("POST: sai quy tắc → 422 kèm lỗi theo ô", async () => {
    actions.addWord.mockResolvedValue({ ok: false, fieldErrors: { senses: { 0: "Vui lòng nhập nghĩa tiếng Việt." } } });
    const res = await createWord(json({ term: "long", senses: [{}] }));
    expect(res.status).toBe(422);
    expect((await res.json()).errors.senses["0"]).toBeDefined();
  });

  it("PUT: từ không tồn tại → 404", async () => {
    actions.updateWord.mockResolvedValue({ ok: false, message: "Không tìm thấy từ này. Có thể từ đã bị xoá." });
    expect((await editWord(json(word), ctx)).status).toBe(404);
    expect(actions.updateWord).toHaveBeenCalledWith("w1", expect.any(Object));
  });

  it("DELETE: thành công → báo đã lưu vào deleted_words (AC-05.2)", async () => {
    actions.deleteWord.mockResolvedValue({ ok: true, term: "long" });
    const body = await (await removeWord(new Request("http://x"), ctx)).json();
    expect(body).toEqual({ deleted: "long", archived_to: "deleted_words" });
  });
});
