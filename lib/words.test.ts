import { describe, expect, it } from "vitest";
import {
  cambridgeUrl,
  collocationsToLines,
  EMPTY_SENSE,
  isHttpUrl,
  meaningsSummary,
  normalizeCollocations,
  softHyphenate,
  toWordContent,
  toWordInput,
  validateWordInput,
  type WordInput,
} from "./words";

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

describe("toWordContent / toWordInput (dữ liệu từ database → hiển thị / form sửa)", () => {
  const row = {
    term: "long",
    dictionary_url: null,
    word_senses: [
      { sort_order: 2, part_of_speech: "verb", meaning_vi: "mong mỏi", definition_en: null, example: null, collocations: null, notes: null },
      { sort_order: 1, part_of_speech: "adjective", meaning_vi: "dài", definition_en: null, example: null, collocations: "a long time; long hair", notes: null },
    ],
  };

  it("các nghĩa được xếp theo sort_order (BR-14)", () => {
    expect(toWordContent(row).senses.map((s) => s.meaning_vi)).toEqual(["dài", "mong mỏi"]);
  });

  it("ô trống (null) thành chuỗi rỗng, collocation thành mỗi dòng một cụm", () => {
    const input = toWordInput(toWordContent(row));
    expect(input.dictionary_url).toBe("");
    expect(input.senses[0]).toEqual({
      part_of_speech: "adjective",
      meaning_vi: "dài",
      definition_en: "",
      example: "",
      collocations: "a long time\nlong hair",
      notes: "",
    });
  });

  it("Kho từ: các nghĩa nối bằng \" · \" (BR-14)", () => {
    expect(meaningsSummary(toWordContent(row).senses)).toBe("dài · mong mỏi");
  });
});

describe("validateWordInput (AC-02.1, AC-02.4, AC-02.5)", () => {
  const base = (patch: Partial<WordInput> = {}): WordInput => ({
    term: "long",
    dictionary_url: "",
    senses: [{ ...EMPTY_SENSE, meaning_vi: "dài" }],
    ...patch,
  });

  it("hợp lệ: 1 nghĩa, không có link", () => {
    const r = validateWordInput(base());
    expect(r.ok && r.word).toEqual({
      term: "long",
      dictionary_url: null,
      senses: [{ ...EMPTY_SENSE, meaning_vi: "dài" }],
    });
  });

  it("AC-02.1: thiếu từ vựng và thiếu nghĩa của khối 1 → báo lỗi đúng ô", () => {
    const r = validateWordInput(base({ term: "  ", senses: [{ ...EMPTY_SENSE }] }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.term).toBeDefined();
      expect(r.errors.senses?.[0]).toBeDefined();
    }
  });

  it("AC-02.4: khối 2 trống hoàn toàn → bỏ qua, vẫn lưu được", () => {
    const r = validateWordInput(base({ senses: [{ ...EMPTY_SENSE, meaning_vi: "dài" }, { ...EMPTY_SENSE }] }));
    expect(r.ok && r.word.senses.length).toBe(1);
  });

  it("AC-02.1: khối 2 có nhập ô khác nhưng thiếu nghĩa → báo lỗi ở khối 2", () => {
    const r = validateWordInput(
      base({ senses: [{ ...EMPTY_SENSE, meaning_vi: "dài" }, { ...EMPTY_SENSE, part_of_speech: "verb" }] }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors.senses ?? {})).toEqual(["1"]);
  });

  it("khối 2 trống, khối 3 có nghĩa → lưu 2 nghĩa theo đúng thứ tự", () => {
    const r = validateWordInput(
      base({
        senses: [
          { ...EMPTY_SENSE, meaning_vi: "dài" },
          { ...EMPTY_SENSE },
          { ...EMPTY_SENSE, part_of_speech: "verb", meaning_vi: "mong mỏi" },
        ],
      }),
    );
    expect(r.ok && r.word.senses.map((s) => s.meaning_vi)).toEqual(["dài", "mong mỏi"]);
  });

  it("AC-02.5: link không phải http(s) → báo lỗi; link https → giữ nguyên", () => {
    const bad = validateWordInput(base({ dictionary_url: "javascript:alert(1)" }));
    expect(bad.ok).toBe(false);
    const good = validateWordInput(base({ dictionary_url: " https://dictionary.cambridge.org/x " }));
    expect(good.ok && good.word.dictionary_url).toBe("https://dictionary.cambridge.org/x");
  });
});

describe("Link từ điển (AC-02.5)", () => {
  it("Tạo link Cambridge: chữ thường, dấu cách → \"-\"", () => {
    expect(cambridgeUrl("Long")).toBe("https://dictionary.cambridge.org/dictionary/english/long");
    expect(cambridgeUrl(" look  up to ")).toBe(
      "https://dictionary.cambridge.org/dictionary/english/look-up-to",
    );
  });

  it("chỉ nhận http:// hoặc https://", () => {
    expect(isHttpUrl("https://dictionary.cambridge.org/dictionary/english/long?q=long")).toBe(true);
    expect(isHttpUrl("http://example.com")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("dictionary.cambridge.org")).toBe(false);
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
