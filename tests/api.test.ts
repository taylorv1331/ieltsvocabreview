import { describe, expect, it } from "vitest";
import { POST as srsPreview } from "../app/api/srs/preview/route";
import { POST as validateWord } from "../app/api/words/validate/route";
import { GET as today } from "../app/api/today/route";

const post = (body: unknown) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/srs/preview — Ví dụ chuẩn qua API (mục 4.2)", () => {
  it.each([
    [{ ease_factor: 2.5, interval_days: 0, repetitions: 0, rating: 2, today: "2026-10-01" }, 1, "2026-10-02"],
    [{ ease_factor: 2.5, interval_days: 1, repetitions: 1, rating: 2, today: "2026-10-02" }, 3, "2026-10-05"],
    [{ ease_factor: 2.5, interval_days: 3, repetitions: 2, rating: 2, today: "2026-10-05" }, 8, "2026-10-13"],
    [{ ease_factor: 2.5, interval_days: 8, repetitions: 3, rating: 2, today: "2026-10-13" }, 20, "2026-11-02"],
  ])("%o → %i ngày, ôn lần tới %s", async (body, interval, due) => {
    const res = await srsPreview(post(body));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.after.interval_days).toBe(interval);
    expect(json.after.due_date).toBe(due);
    expect(json.rule).toMatch(/^BR-03/);
  });

  it("Quên ở lần 3 → BR-01", async () => {
    const json = await (
      await srsPreview(post({ ease_factor: 2.5, interval_days: 3, repetitions: 2, rating: 0, today: "2026-10-05" }))
    ).json();
    expect(json.after).toEqual({ ease_factor: 2.3, interval_days: 0, repetitions: 0, due_date: "2026-10-05" });
    expect(json.rule).toMatch(/^BR-01/);
  });

  it("dữ liệu sai → 400 kèm lỗi tiếng Việt", async () => {
    const res = await srsPreview(post({ ease_factor: 1, interval_days: -1, repetitions: 0, rating: 5 }));
    expect(res.status).toBe(400);
    expect((await res.json()).errors.length).toBe(3);
  });
});

describe("POST /api/words/validate", () => {
  it("hợp lệ: khối 3 trống được bỏ qua", async () => {
    const json = await (
      await validateWord(post({ term: "long", senses: [{ meaning_vi: "dài" }, { meaning_vi: "mong mỏi" }, {}] }))
    ).json();
    expect(json.valid).toBe(true);
    expect(json.will_save.senses).toHaveLength(2);
  });

  it("AC-02.1: khối 2 thiếu nghĩa → lỗi ở khối 2", async () => {
    const json = await (
      await validateWord(post({ term: "long", senses: [{ meaning_vi: "dài" }, { part_of_speech: "verb" }] }))
    ).json();
    expect(json.valid).toBe(false);
    expect(Object.keys(json.errors.senses)).toEqual(["1"]);
  });
});

describe("GET /api/today — BR-00", () => {
  it("trả về ngày dạng YYYY-MM-DD theo giờ Việt Nam", async () => {
    const json = await today().json();
    expect(json.today_vn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(json.time_zone).toBe("Asia/Ho_Chi_Minh");
  });
});
