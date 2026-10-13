"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// BR-13b: số giây khoá nút sau mỗi lần gửi thành công
const COOLDOWN_SECONDS = 60;
// Độ dài mã trong email (Supabase → Email OTP Length)
const CODE_LENGTH = 6;

const inputClass =
  "min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base focus:border-pink-500 focus:outline-none";
const primaryButtonClass =
  "min-h-11 rounded-lg bg-pink-700 font-semibold text-white active:bg-pink-800 disabled:bg-slate-300 disabled:text-slate-600";

export default function LoginForm({ resend }: { resend: boolean }) {
  const router = useRouter();
  // Bước 1: nhập email · Bước 2: nhập mã (sau khi gửi thành công)
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  // AC-01.4: khung báo link hết hạn chỉ hiện tới khi gửi link mới thành công
  const [showLinkError, setShowLinkError] = useState(resend);

  // BR-13b: đếm ngược mỗi giây cho tới 0
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // Gửi email chứa cả link và mã 6 số (BR-13a)
  async function sendEmail(value: string) {
    setSending(true);
    setSendError(null);
    const supabase = createClient();
    // AC-01.2 / AC-01.3: email mới thì Supabase tự tạo tài khoản
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    setSending(false);

    if (error) {
      // Ghi lỗi gốc vào Console (F12) để dễ tìm nguyên nhân; giao diện chỉ hiện tiếng Việt
      console.error("signInWithOtp:", error);
      // BR-13c: quá giới hạn gửi → thông báo tiếng Việt, không hiện lỗi gốc
      const tooMany =
        error.status === 429 ||
        error.code === "over_email_send_rate_limit" ||
        error.code === "over_request_rate_limit";
      setSendError(
        tooMany
          ? "Bạn đã yêu cầu quá nhiều link. Vui lòng thử lại sau ít phút."
          : error.code === "email_address_invalid" || error.code === "validation_failed"
            ? "Email không hợp lệ. Vui lòng kiểm tra lại."
            : "Không gửi được link. Vui lòng thử lại.",
      );
      return;
    }

    setSentTo(value);
    setStep("code");
    setCode("");
    setCodeError(null);
    setShowLinkError(false);
    // Bỏ ?error=link trên thanh địa chỉ để tải lại trang không hiện lại thông báo cũ
    window.history.replaceState(null, "", "/login");
    setSecondsLeft(COOLDOWN_SECONDS);
  }

  function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setSendError("Vui lòng nhập email.");
      return;
    }
    sendEmail(value);
  }

  // AC-01.6: xác nhận mã ngay trên tab này, không mở tab mới
  async function verifyCode(token: string) {
    setVerifying(true);
    setCodeError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email: sentTo, token, type: "email" });

    if (error) {
      console.error("verifyOtp:", error);
      setVerifying(false);
      setCode("");
      // AC-01.7: mã sai / đã dùng / hết hạn → báo lỗi, vẫn nhập lại hoặc gửi mã mới được
      // BR-13g: thử quá nhiều lần → Supabase trả 429
      setCodeError(
        error.status === 429
          ? "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút."
          : "Mã không đúng hoặc đã hết hạn. Kiểm tra lại, hoặc gửi mã mới.",
      );
      return;
    }

    // Đăng nhập thành công: phiên đã lưu vào cookie → vào app trên chính tab này
    router.replace("/");
    router.refresh();
  }

  function handleCodeChange(raw: string) {
    // Chỉ giữ chữ số (dán "482 913" vẫn được), tối đa 6 số
    const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    setCodeError(null);
    // Gõ đủ 6 số là tự đăng nhập
    if (digits.length === CODE_LENGTH && !verifying) verifyCode(digits);
  }

  function handleCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setCodeError(`Vui lòng nhập đủ ${CODE_LENGTH} số.`);
      return;
    }
    verifyCode(code);
  }

  const resendLabel = sending
    ? "Đang gửi…"
    : secondsLeft > 0
      ? `Gửi lại sau ${secondsLeft} giây`
      : step === "code"
        ? "Gửi mã mới"
        : resend
          ? "Gửi link mới"
          : "Gửi link đăng nhập";

  if (step === "code") {
    return (
      <div className="mt-6 flex flex-col gap-3">
        {/* BR-13d: nhắc thời hạn */}
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          ✅ Đã gửi email tới <strong className="break-all">{sentTo}</strong>. Link và mã có hiệu
          lực trong 1 giờ.
        </p>

        <form onSubmit={handleCodeSubmit} noValidate className="flex flex-col gap-3">
          <label htmlFor="code" className="text-sm font-medium">
            Mã đăng nhập
          </label>
          <input
            id="code"
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            placeholder="6 số trong email"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            disabled={verifying}
            aria-invalid={Boolean(codeError)}
            aria-describedby={codeError ? "code-error" : undefined}
            className={`${inputClass} text-center text-2xl tracking-[0.5em] aria-[invalid=true]:border-red-500`}
          />
          {codeError && (
            <p id="code-error" role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {codeError}
            </p>
          )}
          <button type="submit" disabled={verifying} className={primaryButtonClass}>
            {verifying ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">Hoặc bấm link trong email.</p>

        <button
          type="button"
          disabled={sending || secondsLeft > 0}
          onClick={() => sendEmail(sentTo)}
          className="min-h-11 rounded-lg border border-slate-300 font-medium text-slate-700 active:bg-slate-100 disabled:text-slate-400"
        >
          {resendLabel}
        </button>
        {sendError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {sendError}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setCodeError(null);
          }}
          className="min-h-11 text-sm text-pink-700 underline"
        >
          Đổi email khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} noValidate className="mt-6 flex flex-col gap-3">
      {/* AC-01.4: link đã dùng hoặc hết hạn */}
      {showLinkError && (
        <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Link đăng nhập đã hết hạn hoặc đã được dùng. Nhập email để nhận link mới.
        </p>
      )}
      <label htmlFor="email" className="text-sm font-medium">
        Email
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="ban@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
      />
      <button type="submit" disabled={sending || secondsLeft > 0} className={primaryButtonClass}>
        {resendLabel}
      </button>
      {sendError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {sendError}
        </p>
      )}
    </form>
  );
}
