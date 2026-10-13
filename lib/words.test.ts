import { describe, expect, it } from "vitest";
import { collocationsToLines, normalizeCollocations, softHyphenate, toWordInput } from "./words";

describe("Collocation: form ↔ database", () => {
  it("form (mỗi dòng một cụm) → lưu dạng \"a; b\" (BR-11)", () => {
    expect(normalizeCollocations(" mitigate the impact \n\nmitigate risks; ")).toBe(
      "mitigate the impact; mitigate risks",
    );
  });

  it("database \"a; b\" → mỗi cụm một dòng trong form sửa (US-05)", () => {
    expect(collocationsToLines("mitigate the impact; mitigate risks")).toBe(
      "mitigate the impact\nmitigate risks",
    );
    expect(collocationsToLines(null)).toBe("");
  });

  it("mở form sửa rồi lưu lại ngay → giá trị không đổi", () => {
    const stored = "mitigate the impact; mitigate risks";
    expect(normalizeCollocations(collocationsToLines(stored))).toBe(stored);
  });
});

describe("toWordInput: dữ liệu từ → giá trị ban đầu của form sửa", () => {
  it("ô trống (null) thành chuỗi rỗng", () => {
    expect(
      toWordInput({
        term: "mitigate",
        part_of_speech: null,
        meaning_vi: "giảm nhẹ",
        definition_en: null,
        example: null,
        collocations: null,
        notes: null,
      }),
    ).toEqual({
      term: "mitigate",
      meaning_vi: "giảm nhẹ",
      part_of_speech: "",
      example: "",
      collocations: "",
      definition_en: "",
      notes: "",
    });
  });
});

describe("softHyphenate (hiển thị từ rất dài)", () => {
  const SHY = "­";
  it("từ ngắn giữ nguyên", () => {
    expect(softHyphenate("mitigate the impact")).toBe("mitigate the impact");
  });
  it("từ dài được chèn điểm ngắt mềm mỗi 6 chữ, bỏ đi thì vẫn là từ gốc", () => {
    const word = "Pneumonoultramicroscopicsilicovolcanoconiosis";
    const result = softHyphenate(word);
    expect(result.split(SHY)[0]).toBe("Pneumo");
    expect(result.replaceAll(SHY, "")).toBe(word);
  });
  it("không để dòng cuối chỉ còn 1–2 chữ", () => {
    const parts = softHyphenate("abcdefghijklmnop").split(SHY); // 16 chữ → 6 + 10
    expect(parts.at(-1)!.length).toBeGreaterThanOrEqual(3);
  });
});
