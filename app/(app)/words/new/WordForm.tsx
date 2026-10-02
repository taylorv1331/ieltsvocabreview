"use client";

import { useRef, useState } from "react";
import { PARTS_OF_SPEECH, TERM_MAX_LENGTH, type WordInput } from "@/lib/words";
import { addWord, checkDuplicate, type FieldErrors } from "./actions";

const EMPTY: WordInput = {
  term: "",
  meaning_vi: "",
  part_of_speech: "",
  example: "",
  collocations: "",
  definition_en: "",
  notes: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-pink-500 focus:outline-none aria-[invalid=true]:border-red-500";

export default function WordForm() {
  const [values, setValues] = useState<WordInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const termRef = useRef<HTMLInputElement>(null);

  function update(field: keyof WordInput, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    // Gõ lại thì xoá lỗi của ô đó
    if (field === "term" || field === "meaning_vi") {
      setErrors((e) => ({ ...e, [field]: undefined }));
    }
  }

  // AC-02.2: báo trùng ngay khi rời ô "Từ vựng"
  async function handleTermBlur() {
    const term = values.term;
    const warning = await checkDuplicate(term);
    // Bỏ qua kết quả nếu trong lúc chờ người dùng đã sửa sang từ khác
    if (warning && termRef.current?.value === term) {
      setErrors((e) => ({ ...e, term: warning }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    // AC-02.1: không cho lưu khi thiếu ô bắt buộc (khoảng trắng coi như trống)
    const clientErrors: FieldErrors = {};
    if (!values.term.trim()) clientErrors.term = "Vui lòng nhập từ vựng.";
    if (!values.meaning_vi.trim()) clientErrors.meaning_vi = "Vui lòng nhập nghĩa tiếng Việt.";
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    setSaving(true);
    const result = await addWord(values);
    setSaving(false);

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      if (result.message) setMessage({ kind: "error", text: result.message });
      return;
    }

    // Lưu xong: xoá trắng form, báo thành công, đưa con trỏ về ô "Từ vựng" để thêm tiếp
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
          onChange={(e) => update("term", e.target.value)}
          onBlur={handleTermBlur}
          maxLength={TERM_MAX_LENGTH}
          autoCapitalize="none"
          autoComplete="off"
          placeholder="mitigate"
          aria-invalid={Boolean(errors.term)}
          aria-describedby={errors.term ? "term-error" : undefined}
          className={`${inputClass} min-h-11`}
        />
      </Field>

      <Field id="meaning_vi" label="Nghĩa tiếng Việt" required error={errors.meaning_vi}>
        <input
          id="meaning_vi"
          value={values.meaning_vi}
          onChange={(e) => update("meaning_vi", e.target.value)}
          placeholder="giảm nhẹ, làm dịu"
          aria-invalid={Boolean(errors.meaning_vi)}
          aria-describedby={errors.meaning_vi ? "meaning_vi-error" : undefined}
          className={`${inputClass} min-h-11`}
        />
      </Field>

      <Field id="part_of_speech" label="Từ loại">
        <select
          id="part_of_speech"
          value={values.part_of_speech}
          onChange={(e) => update("part_of_speech", e.target.value)}
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

      <Field id="example" label="Câu ví dụ">
        <textarea
          id="example"
          rows={2}
          value={values.example}
          onChange={(e) => update("example", e.target.value)}
          placeholder="Governments must act to mitigate the effects of climate change."
          className={inputClass}
        />
      </Field>

      <Field id="collocations" label="Collocation" hint="Mỗi collocation một dòng, hoặc cách nhau bằng dấu ;">
        <textarea
          id="collocations"
          rows={3}
          value={values.collocations}
          onChange={(e) => update("collocations", e.target.value)}
          placeholder={"mitigate the impact\nmitigate risks"}
          className={inputClass}
        />
      </Field>

      <Field id="definition_en" label="Định nghĩa tiếng Anh">
        <textarea
          id="definition_en"
          rows={2}
          value={values.definition_en}
          onChange={(e) => update("definition_en", e.target.value)}
          placeholder="to make something less harmful or serious"
          className={inputClass}
        />
      </Field>

      <Field id="notes" label="Ghi chú">
        <textarea
          id="notes"
          rows={2}
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          className={inputClass}
        />
      </Field>

      <button
        type="submit"
        disabled={saving}
        className="min-h-11 rounded-lg bg-pink-700 font-semibold text-white active:bg-pink-800 disabled:bg-slate-300 disabled:text-slate-600"
      >
        {saving ? "Đang lưu…" : "Lưu từ"}
      </button>
    </form>
  );
}

// Một ô trong form: nhãn, (không bắt buộc), gợi ý và thông báo lỗi
function Field({
  id,
  label,
  required = false,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
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
          <span className="font-normal text-slate-500"> (không bắt buộc)</span>
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
