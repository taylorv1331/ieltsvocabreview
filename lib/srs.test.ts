import { describe, expect, it } from "vitest";
import { schedule, type SrsState } from "./srs";

// Trạng thái của một từ vừa thêm (mục 4.2)
const NEW_WORD: SrsState = { ease_factor: 2.5, interval_days: 0, repetitions: 0 };

describe("Ví dụ chuẩn (mục 4.2): thêm mitigate ngày 2026-10-01, lần nào cũng bấm Nhớ", () => {
  const review1 = schedule(NEW_WORD, 2, "2026-10-01");
  const review2 = schedule(review1, 2, "2026-10-02");
  const review3 = schedule(review2, 2, "2026-10-05");
  const review4 = schedule(review3, 2, "2026-10-13");

  it.each([
    ["Lần 1", review1, 1, "2026-10-02"],
    ["Lần 2", review2, 3, "2026-10-05"],
    ["Lần 3", review3, 8, "2026-10-13"], // round(3 × 2.5) = round(7.5) = 8
    ["Lần 4", review4, 20, "2026-11-02"], // 8 × 2.5 = 20
  ])("%s → khoảng %i ngày, ôn lần tới %s", (_, result, interval, due) => {
    expect(result.interval_days).toBe(interval);
    expect(result.due_date).toBe(due);
    expect(result.ease_factor).toBe(2.5); // BR-03: Nhớ giữ nguyên ease
  });

  it("repetitions tăng 1 sau mỗi lần nhớ", () => {
    expect([review1, review2, review3, review4].map((r) => r.repetitions)).toEqual([1, 2, 3, 4]);
  });
});

describe("BR-01: bấm Quên ở lần 3 của ví dụ chuẩn", () => {
  const review1 = schedule(NEW_WORD, 2, "2026-10-01");
  const review2 = schedule(review1, 2, "2026-10-02");
  const forgot = schedule(review2, 0, "2026-10-05");

  it("interval 0, repetitions 0, ease 2.3, quay lại hôm nay", () => {
    expect(forgot).toEqual({
      ease_factor: 2.3,
      interval_days: 0,
      repetitions: 0,
      due_date: "2026-10-05",
    });
  });

  it("ôn lại cuối phiên và bấm Nhớ → bắt đầu lại từ 1 ngày", () => {
    const again = schedule(forgot, 2, "2026-10-05");
    expect(again.interval_days).toBe(1);
    expect(again.due_date).toBe("2026-10-06");
    expect(again.ease_factor).toBe(2.3);
  });
});

describe("BR-02: Khó", () => {
  it("từ mới: khoảng cũ 0 × 1.2 = 0 → tối thiểu 1 ngày; ease − 0.15", () => {
    expect(schedule(NEW_WORD, 1, "2026-10-01")).toEqual({
      ease_factor: 2.35,
      interval_days: 1,
      repetitions: 1,
      due_date: "2026-10-02",
    });
  });

  it("khoảng cũ 3 → round(3.6) = 4 ngày", () => {
    const state = { ease_factor: 2.5, interval_days: 3, repetitions: 2 };
    expect(schedule(state, 1, "2026-10-05").interval_days).toBe(4);
  });
});

describe("BR-04: Dễ", () => {
  it("lần đầu (repetitions = 0) → 4 ngày; ease + 0.15", () => {
    expect(schedule(NEW_WORD, 3, "2026-10-01")).toEqual({
      ease_factor: 2.65,
      interval_days: 4,
      repetitions: 1,
      due_date: "2026-10-05",
    });
  });

  it("repetitions = 1 → round(3 × 1.3) = 4 ngày", () => {
    const state = { ease_factor: 2.5, interval_days: 1, repetitions: 1 };
    expect(schedule(state, 3, "2026-10-02").interval_days).toBe(4);
  });

  it("repetitions = 2, khoảng cũ 3 → round(3 × 2.5 × 1.3) = round(9.75) = 10 ngày (dùng ease cũ)", () => {
    const state = { ease_factor: 2.5, interval_days: 3, repetitions: 2 };
    const result = schedule(state, 3, "2026-10-05");
    expect(result.interval_days).toBe(10);
    expect(result.ease_factor).toBe(2.65);
  });
});

describe("BR-05: ease_factor không bao giờ thấp hơn 1.3", () => {
  it("Quên khi ease 1.4 → 1.3 (không phải 1.2)", () => {
    const state = { ease_factor: 1.4, interval_days: 5, repetitions: 3 };
    expect(schedule(state, 0, "2026-10-01").ease_factor).toBe(1.3);
  });

  it("Khó khi ease đã là 1.3 → vẫn 1.3", () => {
    const state = { ease_factor: 1.3, interval_days: 5, repetitions: 3 };
    expect(schedule(state, 1, "2026-10-01").ease_factor).toBe(1.3);
  });

  it("Khó nhiều lần liên tiếp: ease giảm đều, không có sai số thập phân", () => {
    let state: SrsState = NEW_WORD;
    const eases: number[] = [];
    for (let i = 0; i < 6; i++) {
      state = schedule(state, 1, "2026-10-01");
      eases.push(state.ease_factor);
    }
    expect(eases).toEqual([2.35, 2.2, 2.05, 1.9, 1.75, 1.6]);
  });
});
