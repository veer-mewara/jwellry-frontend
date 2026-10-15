"use client";

import { FormEvent, useEffect, useState } from "react";
import { endpoint, jsonHeaders, passwordProblem, requestJson, responseMessage } from "@/lib/account-api";

const RESEND_SECONDS = 60;

/**
 * "Forgot password": the shopper enters their email or mobile, gets a 6-digit code by email
 * (and WhatsApp), then sets a new password. On success they are signed in.
 */
export function ForgotPasswordForm({ onDone, onBack }: { onDone: (token: string) => void; onBack: () => void }) {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    const url = endpoint("/account/forgot-password");
    if (!url) return setError("Account API URL is not configured.");
    if (!identifier.trim()) return setError("Enter your email address or mobile number.");

    setLoading(true);
    setError("");
    try {
      const { response, payload } = await requestJson<{ message?: string; otp_preview?: string }>(url, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      if (!response.ok) throw new Error(responseMessage(response, payload));
      setNotice(payload.message || "If an account matches, we have sent a code.");
      setPreview(payload.otp_preview || "");
      if (payload.otp_preview) setCode(payload.otp_preview);
      setStep("reset");
      setWait(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The code could not be sent.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const problem = passwordProblem(password)
      || (password !== String(form.get("password_confirmation") ?? "") ? "The two passwords don't match." : "")
      || (code.length !== 6 ? "Enter the 6-digit code." : "");
    if (problem) return setError(problem);

    const url = endpoint("/account/reset-password");
    if (!url) return setError("Account API URL is not configured.");

    setLoading(true);
    setError("");
    try {
      const { response, payload } = await requestJson<{ token?: string }>(url, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp_code: code,
          password,
          password_confirmation: password,
        }),
      });
      if (!response.ok || !payload.token) throw new Error(responseMessage(response, payload));
      onDone(payload.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your password could not be changed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Reset your password</h2>

      {step === "request" ? (
        <form onSubmit={sendCode}>
          <p style={{ color: "#666", marginTop: "-14px", marginBottom: "24px", lineHeight: 1.5 }}>
            Enter the email address or mobile number on your account. We will send you a 6-digit code.
          </p>
          <div className="premiumInputWrap">
            <label htmlFor="reset-identifier">Email or mobile number</label>
            <input
              id="reset-identifier"
              required
              autoFocus
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="jane@example.com or 9876543210"
            />
          </div>
          <button disabled={loading} type="submit" className="premiumBtn">
            {loading ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword}>
          {notice && <p className="integrationNotice" role="status" style={{ marginTop: "-12px", marginBottom: "20px" }}>{notice}</p>}
          {preview && (
            <p className="integrationNotice" style={{ marginBottom: "20px" }}>
              <strong>Test code:</strong> {preview}
            </p>
          )}
          <div className="premiumInputWrap">
            <label htmlFor="reset-code">6-digit code</label>
            <input
              id="reset-code"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              style={{ letterSpacing: "6px", fontFamily: "monospace", fontSize: "20px" }}
            />
          </div>
          <div className="premiumInputWrap">
            <label htmlFor="reset-password">New password</label>
            <div style={{ position: "relative" }}>
              <input
                id="reset-password"
                required
                minLength={8}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-describedby="reset-password-hint"
                placeholder="••••••••"
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#666", cursor: "pointer", padding: 0 }}
              >
                <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} style={{ fontSize: "18px" }} />
              </button>
            </div>
            <small id="reset-password-hint" style={{ display: "block", marginTop: "6px", color: "#666", fontSize: "13px" }}>
              At least 8 characters, with letters and numbers.
            </small>
          </div>
          <div className="premiumInputWrap">
            <label htmlFor="reset-password-confirm">Confirm new password</label>
            <input
              id="reset-password-confirm"
              required
              minLength={8}
              name="password_confirmation"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>
          <button disabled={loading} type="submit" className="premiumBtn">
            {loading ? "Saving…" : "Set new password & sign in"}
          </button>
          <p style={{ marginTop: "16px", fontSize: "14px", color: "#666", textAlign: "center" }}>
            Didn&apos;t get it?{" "}
            <button
              type="button"
              disabled={loading || wait > 0}
              onClick={() => void sendCode()}
              style={{ background: "none", border: "none", padding: 0, color: wait > 0 ? "#999" : "#a87932", fontWeight: 600, cursor: wait > 0 ? "default" : "pointer", textDecoration: "underline" }}
            >
              {wait > 0 ? `Resend in ${wait}s` : "Send a new code"}
            </button>
            {" · "}
            <button
              type="button"
              onClick={() => { setStep("request"); setError(""); setNotice(""); }}
              style={{ background: "none", border: "none", padding: 0, color: "#666", cursor: "pointer", textDecoration: "underline" }}
            >
              Use a different email or mobile
            </button>
          </p>
        </form>
      )}

      {error && <p className="integrationNotice" style={{ marginTop: "20px", textAlign: "center" }} role="alert">{error}</p>}

      <div className="premiumSwitch">
        Remembered it?
        <button type="button" onClick={onBack}>Back to sign in</button>
      </div>
    </div>
  );
}
