import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDateVN, todayVN } from "./date";

describe("BR-00: todayVN() tính theo giờ Việt Nam (UTC+7)", () => {
  it("23:59 ngày 30/09 giờ VN (16:59 UTC) vẫn là 2026-09-30", () => {
    expect(todayVN(new Date("2026-09-30T16:59:59Z"))).toBe("2026-09-30");
  });

  it("00:00 ngày 01/10 giờ VN (17:00 UTC hôm trước) đã là 2026-10-01", () => {
    expect(todayVN(new Date("2026-09-30T17:00:00Z"))).toBe("2026-10-01");
  });
});

describe("addDays", () => {
  it.each([
    ["2026-10-01", 0, "2026-10-01"],
    ["2026-10-01", 1, "2026-10-02"],
    ["2026-10-13", 20, "2026-11-02"],
    ["2026-02-28", 1, "2026-03-01"],
    ["2026-12-31", 1, "2027-01-01"],
    ["2026-10-01", -6, "2026-09-25"],
  ])("%s + %i ngày = %s", (date, days, expected) => {
    expect(addDays(date, days)).toBe(expected);
  });
});

describe("daysBetween", () => {
  it("đếm số ngày quá hạn", () => {
    expect(daysBetween("2026-09-26", "2026-10-01")).toBe(5);
    expect(daysBetween("2026-10-01", "2026-10-01")).toBe(0);
    expect(daysBetween("2026-10-01", "2026-10-02")).toBe(1);
  });
});

describe("formatDateVN", () => {
  it("2026-10-02 → 02/10/2026", () => {
    expect(formatDateVN("2026-10-02")).toBe("02/10/2026");
  });
});
