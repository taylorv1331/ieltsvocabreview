"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  cambridgeUrl,
  EMPTY_SENSE,
  MAX_SENSES,
  PARTS_OF_SPEECH,
  TERM_MAX_LENGTH,
  validateWordInput,
  type FieldErrors,
  type SenseInput,
  type WordInput,
} from "@/lib/words";
import { addWord, checkDuplicate, updateWord } from "@/app/(app)/words/actions";

const EMPTY: WordInput = { term: "", dictionary_url: "", senses: [{ ...EMPTY_SENSE }] };

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-pink-500 focus:outline-none aria-[invalid=true]:border-red-500";

// Form dùng chung: thêm từ (US-02) và sửa từ (US-05).
// Khi sửa: truyền `wordId` + `initial` (nội dung hiện tại của từ).
export default function WordForm({ wordId, initial }: { wordId?: string; initial?: WordInput }) {
  const router = useRouter();
  const editing = Boolean(wordId);
  const [values, setValues] = useState<WordInput>(initial ?? EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const termRef = useRef<HTMLInputElement>(null);

  function updateTerm(value: string) {
    setValues((v) => ({ ...v, term: value }));
    setErrors((e) => ({ ...e, term: undefined }));
  }

  function updateUrl(value: string) {
    setValues((v) => ({ ...v, dictionary_url: value }));
    setErrors((e) => ({ ...e, dictionary_url: undefined }));
  }

  function updateSense(index: number, field: keyof SenseInput, value: string) {
    setValues((v) => ({
      ...v,
      senses: v.senses.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
    if (field === "meaning_vi") {
      setErrors((e) => {
        if (!e.senses?.[index]) return e;
        const senses = { ...e.senses };
        delete senses[index];
        return { ...e, senses };
      });
    }
  }

  // AC-02.4: thêm một khối nghĩa (tối đa 3)
  function addSense() {
    setValues((v) =>
      v.senses.length >= MAX_SENSES ? v : { ...v, senses: [...v.senses, { ...EMPTY_SENSE }] },
    );
  }

  // AC-02.5: tự điền link Cambridge từ ô "Từ vựng" (vẫn sửa tay được)
  function fillCambridge() {
    if (!values.term.trim()) {
      setErrors((e) => ({ ...e, term: "Nhập từ vựng trước để tạo link." }));
      termRef.current?.focus();
      return;
    }
    updateUrl(cambridgeUrl(values.term));
  }

  // AC-02.2: báo trùng ngay khi rời ô "Từ vựng"
  async function handleTermBlur() {
    const term = values.term;
    // Khi sửa, bỏ qua chính từ đang sửa
    const warning = await checkDuplicate(term, wordId);
    // Bỏ qua kết quả nếu trong lúc chờ người dùng đã sửa sang từ khác
    if (warning && termRef.current?.value === term) {
      setErrors((e) => ({ ...e, term: warning }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    // AC-02.1, AC-02.4, AC-02.5: cùng quy tắc với server (lib/words.ts)
    const checked = validateWordInput(values);
    if (!checked.ok) {
      setErrors(checked.errors);
      return;
    }

    setSaving(true);
    const result = wordId ? await updateWord(wordId, values) : await addWord(values);

    if (!result.ok) {
      setSaving(false);
      setErrors(result.fieldErrors ?? {});
      if (result.message) setMessage({ kind: "error", text: result.message });
      return;
    }

    if (editing) {
      // AC-05.1: lưu xong quay về trang chi tiết, thấy ngay nội dung mới
      router.push(`/words/${result.id}?saved=1`);
      return;
    }
    // Thêm xong: xoá trắng form, báo thành công, đưa con trỏ về ô "Từ vựng" để thêm tiếp
    setSaving(false);
    setValues(EMPTY);
    setErrors({});
    setMessage({
      kind: "success",
      text: `Đã thêm "${result.term}". Từ này sẽ có trong bài ôn hôm nay.`,
    });
    termRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
      <div aria-live="polite">
        {message && (
          <p
            role={message.kind === "error" ? "alert" : undefined}
            className={`rounded-lg p-3 text-sm ${
              message.kind === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
            }`}
          >
            {message.kind === "success" ? "✅ " : ""}
            {message.text}
          </p>
        )}
      </div>

      <Field id="term" label="Từ vựng" required error={errors.term}>
        <input
          ref={termRef}
          id="term"
          value={values.term}
          onChange={(e) => updateTerm(e.target.value)}
          onBlur={handleTermBlur}
          maxLength={TERM_MAX_LENGTH}
          autoCapitalize="none"
          autoComplete="off"
          placeholder="long"
          aria-invalid={Boolean(errors.term)}
          aria-describedby={errors.term ? "term-error" : undefined}
          className={`${inputClass} min-h-11`}
        />
      </Field>

      {/* AC-02.5: link từ điển */}
      <Field
        id="dictionary_url"
        label="Link từ điển"
        hint="Nghe phát âm và xem thêm về từ ở link sau (gợi ý: trang từ điển online của Cambridge)"
        error={errors.dictionary_url}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="dictionary_url"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoComplete="off"
            value={values.dictionary_url}
            onChange={(e) => updateUrl(e.target.value)}
            placeholder="https://dictionary.cambridge.org/dictionary/english/long"
            aria-invalid={Boolean(errors.dictionary_url)}
            aria-describedby={errors.dictionary_url ? "dictionary_url-error" : undefined}
            className={`${inputClass} min-h-11 min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={fillCambridge}
            className="min-h-11 shrink-0 rounded-lg border border-pink-300 px-3 text-sm font-medium text-pink-700 active:bg-pink-50 md:hover:bg-pink-50"
          >
            Tạo link Cambridge
          </button>
        </div>
      </Field>

      {/* BR-14: 1–3 khối nghĩa */}
      {values.senses.map((sense, index) => (
        <fieldset key={index} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <legend className="px-1 text-sm font-semibold text-pink-700">Nghĩa {index + 1}</legend>
          <SenseFields
            index={index}
            sense={sense}
            error={errors.senses?.[index]}
            onChange={(field, value) => updateSense(index, field, value)}
          />
          {/* AC-02.4: dòng "+ Thêm nghĩa của từ" ở cuối khối cuối cùng; đủ 3 khối thì ẩn */}
          {index === values.senses.length - 1 && values.senses.length < MAX_SENSES && (
            <button
              type="button"
              onClick={addSense}
              className="-mb-1 flex min-h-11 items-center gap-1.5 self-start text-sm font-medium text-pink-700"
            >
              <Plus aria-hidden size={18} />
              Thêm nghĩa của từ
            </button>
          )}
        </fieldset>
      ))}

      <button
        type="submit"
        disabled={saving}
        className="min-h-11 rounded-lg bg-pink-700 font-semibold text-white active:bg-pink-800 disabled:bg-slate-300 disabled:text-slate-600"
      >
        {saving ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Lưu từ"}
      </button>
      {editing && (
        <Link
          href={`/words/${wordId}`}
          className="flex min-h-11 items-center justify-center rounded-lg border border-slate-300 font-medium text-slate-700 active:bg-slate-100"
        >
          Huỷ
        </Link>
      )}
    </form>
  );
}

// Các ô của một khối nghĩa
function SenseFields({
  index,
  sense,
  error,
  onChange,
}: {
  index: number;
  sense: SenseInput;
  error?: string;
  onChange: (field: keyof SenseInput, value: string) => void;
}) {
  const id = (field: string) => `sense-${index}-${field}`;
  return (
    <>
      <Field id={id("part_of_speech")} label="Từ loại">
        <select
          id={id("part_of_speech")}
          value={sense.part_of_speech}
          onChange={(e) => onChange("part_of_speech", e.target.value)}
          className={`${inputClass} min-h-11`}
        >
          <option value="">— Chưa chọn —</option>
          {PARTS_OF_SPEECH.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id={id("meaning_vi")}
        label="Nghĩa tiếng Việt"
        required={index === 0}
        requiredNote={index > 0 ? "(bắt buộc nếu dùng khối này)" : undefined}
        error={error}
      >
        <input
          id={id("meaning_vi")}
          value={sense.meaning_vi}
          onChange={(e) => onChange("meaning_vi", e.target.value)}
          placeholder={index === 0 ? "dài" : "mong mỏi, khao khát"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id("meaning_vi")}-error` : undefined}
          className={`${inputClass} min-h-11`}
        />
      </Field>

      <Field id={id("definition_en")} label="Định nghĩa tiếng Anh">
        <textarea
          id={id("definition_en")}
          rows={2}
          value={sense.definition_en}
          onChange={(e) => onChange("definition_en", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field id={id("example")} label="Câu ví dụ">
        <textarea
          id={id("example")}
          rows={2}
          value={sense.example}
          onChange={(e) => onChange("example", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field id={id("collocations")} label="Collocation" hint="Mỗi collocation một dòng, hoặc cách nhau bằng dấu ;">
        <textarea
          id={id("collocations")}
          rows={3}
          value={sense.collocations}
          onChange={(e) => onChange("collocations", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field id={id("notes")} label="Ghi chú">
        <textarea
          id={id("notes")}
          rows={2}
          value={sense.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          className={inputClass}
        />
      </Field>
    </>
  );
}

// Một ô trong form: nhãn, (không bắt buộc), gợi ý và thông báo lỗi
function Field({
  id,
  label,
  required = false,
  requiredNote,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  requiredNote?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span className="text-red-600"> *</span>
        ) : (
          <span className="font-normal text-slate-500"> {requiredNote ?? "(không bắt buộc)"}</span>
        )}
      </label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
