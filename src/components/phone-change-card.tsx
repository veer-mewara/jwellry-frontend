"use client";

import { FormEvent, useState } from "react";
import { endpoint, jsonHeaders, requestJson, responseMessage } from "@/lib/account-api";

export interface PhoneUpdate {
  phone: string;
  is_phone_verified: boolean;
  phone_verified_at?: string;
}

/**
 * Add or change the account's mobile number. A 6-digit code is sent first (WhatsApp to the new
 * number, or the account email while WhatsApp is off) and the number is saved only once it is entered.
 */
export function PhoneChangeCard({
  token,
  currentPhone,
  onSaved,
  onCancel,
}: {
  token: string;
  currentPhone?: string;
  onSaved: (update: PhoneUpdate) => void;
  onCancel: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function sendCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const url = endpoint("/account/phone/send-code");
    if (!url) return;
    setLoading(true);
    setMessage("");
    try {
      const { response, payload } = await requestJson<{ message?: string; otp_preview?: string }>(url, {
        method: "POST",
        headers: jsonHeaders(token),
        body: JSON.stringify({ phone }),
      });
      // 429 = a code went out less than a minute ago; it can still be typed in.
      if (!response.ok && !(response.status === 429 && sentTo === phone)) throw new Error(responseMessage(response, payload));
      setSentTo(phone);
      setMessage(response.ok ? payload.message || "We have sent you a 6-digit code." : responseMessage(response, payload));
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
    const url = endpoint("/account/phone/verify");
    if (!url) return;
    if (code.length !== 6) return setMessage("Enter the 6-digit code.");
    setLoading(true);
    setMessage("");
    try {
      const { response, payload } = await requestJson<{ data?: PhoneUpdate }>(url, {
        method: "POST",
        headers: jsonHeaders(token),
        body: JSON.stringify({ phone: sentTo, otp_code: code }),
      });
      if (!response.ok || !payload.data) throw new Error(responseMessage(response, payload));
      onSaved(payload.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The code could not be checked.");
    } finally {
      setLoading(false);
    }
  }

  function editNumber() {
    setSentTo("");
    setCode("");
    setPreview("");
    setMessage("");
  }

  return (
    <section className="accountPanel phoneChangeCard" aria-labelledby="phone-change-title">
      <style>{`
        .phoneChangeCard { border-left: 4px solid #201611; margin-bottom: 24px; }
        .phoneChangeCard h2 { display: flex; align-items: center; gap: 8px; }
        .phoneChangeRow { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 12px; }
        .phoneChangeRow input { padding: 10px 12px; font-size: 16px; }
        .phoneChangeRow input[type="tel"] { max-width: 240px; }
        .phoneChangeRow .codeInput { max-width: 180px; letter-spacing: 6px; font-family: monospace; font-size: 18px; text-align: center; }
        .phoneChangeLink { background: none; border: 0; padding: 0; color: #6f625a; text-decoration: underline; cursor: pointer; font-size: 13px; }
      `}</style>
      <h2 id="phone-change-title">
        <i className="ri-smartphone-line" /> {currentPhone ? "Change mobile number" : "Add mobile number"}
      </h2>

      {!sentTo ? (
        <form onSubmit={sendCode}>
          {currentPhone && <p>Your current number is <strong>{currentPhone}</strong>.</p>}
          <div className="phoneChangeRow">
            <input
              type="tel"
              autoFocus
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="10-digit mobile number"
              aria-label="New mobile number"
            />
            <button className="button buttonDark" type="submit" disabled={loading || phone.replace(/\D/g, "").length < 10}>
              {loading ? "Sending…" : "Send code"}
            </button>
            <button className="phoneChangeLink" type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p>
            Enter the code to save <strong>{sentTo}</strong>.{" "}
            <button className="phoneChangeLink" type="button" onClick={editNumber}>Use a different number</button>
          </p>
          {preview && <p className="integrationNotice"><strong>Test code:</strong> {preview}</p>}
          <div className="phoneChangeRow">
            <input
              className="codeInput"
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
              {loading ? "Checking…" : "Verify & save"}
            </button>
            <button className="button buttonOutline" type="button" disabled={loading} onClick={() => void sendCode()}>
              Send a new code
            </button>
            <button className="phoneChangeLink" type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      )}

      {message && <p className="integrationNotice" role="status" style={{ marginTop: "12px" }}>{message}</p>}
    </section>
  );
}
