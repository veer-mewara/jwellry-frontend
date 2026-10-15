"use client";

import { FormEvent, useState } from "react";
import { endpoint, jsonHeaders, requestJson, responseMessage } from "@/lib/account-api";

/** Shown on the account page until the email address is confirmed with a 6-digit code. */
export function EmailVerificationCard({ email, token, onVerified }: { email: string; token: string; onVerified: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function sendCode() {
    const url = endpoint("/account/email/send-code");
    if (!url) return;
    setLoading(true);
    setMessage("");
    try {
      const { response, payload } = await requestJson<{ message?: string; otp_preview?: string }>(url, {
        method: "POST",
        headers: jsonHeaders(token),
      });
      // 429 = a code went out less than a minute ago; the form still opens so it can be typed in.
      if (!response.ok && response.status !== 429) throw new Error(responseMessage(response, payload));
      setOpen(true);
      setMessage(payload.message || `We have sent a 6-digit code to ${email}.`);
      if (payload.otp_preview) {
        setPreview(payload.otp_preview);
        setCode(payload.otp_preview);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The code could not be sent.");
    } finally {
      setLoading(false);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = endpoint("/account/email/verify");
    if (!url) return;
    if (code.length !== 6) return setMessage("Enter the 6-digit code.");
    setLoading(true);
    setMessage("");
    try {
      const { response, payload } = await requestJson(url, {
        method: "POST",
        headers: jsonHeaders(token),
        body: JSON.stringify({ otp_code: code }),
      });
      if (!response.ok) throw new Error(responseMessage(response, payload));
      onVerified();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The code could not be checked.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="accountPanel emailVerifyCard" aria-labelledby="email-verify-title">
      <style>{`
        .emailVerifyCard { border-left: 4px solid #e65100; margin-bottom: 24px; }
        .emailVerifyCard h2 { display: flex; align-items: center; gap: 8px; }
        .emailVerifyRow { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 12px; }
        .emailVerifyRow input { max-width: 180px; letter-spacing: 6px; font-family: monospace; font-size: 18px; text-align: center; padding: 10px 12px; }
      `}</style>
      <h2 id="email-verify-title"><i className="ri-mail-check-line" /> Verify your email</h2>
      <p>Confirm <strong>{email}</strong> so order updates and password resets reach you.</p>

      {open ? (
        <form onSubmit={verify}>
          {preview && <p className="integrationNotice"><strong>Test code:</strong> {preview}</p>}
          <div className="emailVerifyRow">
            <input
              id="email-code"
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              aria-label="6-digit code"
            />
            <button className="button buttonDark" type="submit" disabled={loading || code.length !== 6}>
              {loading ? "Checking…" : "Verify"}
            </button>
            <button className="button buttonOutline" type="button" disabled={loading} onClick={() => void sendCode()}>
              Send a new code
            </button>
          </div>
        </form>
      ) : (
        <div className="emailVerifyRow">
          <button className="button buttonDark" type="button" disabled={loading} onClick={() => void sendCode()}>
            {loading ? "Sending…" : "Send verification code"}
          </button>
        </div>
      )}

      {message && <p className="integrationNotice" role="status" style={{ marginTop: "12px" }}>{message}</p>}
    </section>
  );
}
