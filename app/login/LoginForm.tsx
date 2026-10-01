"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// BR-13b: số giây khoá nút sau mỗi lần gửi thành công
const COOLDOWN_SECONDS = 60;

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export default function LoginForm({ resend }: { resend: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [secondsLeft, setSecondsLeft] = useState(0);

  // BR-13b: đếm ngược mỗi giây cho tới 0
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setStatus({ kind: "error", message: "Vui lòng nhập email." });
      return;
    }

    setStatus({ kind: "sending" });
    const supabase = createClient();
    // AC-01.2 / AC-01.3: gửi magic link; email mới thì Supabase tự tạo tài khoản
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      // BR-13c: quá giới hạn gửi → thông báo tiếng Việt, không hiện lỗi gốc
      const tooMany =
        error.status === 429 ||
        error.code === "over_email_send_rate_limit" ||
        error.code === "over_request_rate_limit";
      setStatus({
        kind: "error",
        message: tooMany
          ? "Bạn đã yêu cầu quá nhiều link. Vui lòng thử lại sau ít phút."
          : error.code === "email_address_invalid" || error.code === "validation_failed"
            ? "Email không hợp lệ. Vui lòng kiểm tra lại."
            : "Không gửi được link. Vui lòng thử lại.",
      });
      return;
    }

    setStatus({ kind: "sent", email: value });
    setSecondsLeft(COOLDOWN_SECONDS);
  }

  const locked = status.kind === "sending" || secondsLeft > 0;
  const label =
    status.kind === "sending"
      ? "Đang gửi…"
      : secondsLeft > 0
        ? `Gửi lại sau ${secondsLeft} giây`
        : resend || status.kind === "sent"
          ? "Gửi link mới"
          : "Gửi link đăng nhập";

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-3">
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
        className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base focus:border-blue-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={locked}
        className="min-h-11 rounded-lg bg-blue-600 font-semibold text-white active:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-600"
      >
        {label}
      </button>

      <div aria-live="polite">
        {status.kind === "sent" && (
          // BR-13d: nhắc thời hạn link
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            Đã gửi link tới <strong className="break-all">{status.email}</strong>. Hãy mở email
            và bấm link để vào app. Link có hiệu lực trong 1 giờ.
          </p>
        )}
        {status.kind === "error" && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
