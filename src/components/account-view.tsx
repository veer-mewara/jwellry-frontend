"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ACCOUNT_TOKEN_KEY, safeNextPath } from "@/lib/account";
import { endpoint, passwordProblem, requestJson, responseMessage } from "@/lib/account-api";
import { SocialLoginButtons } from "@/components/social-login-buttons";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { EmailVerificationCard } from "@/components/email-verification-card";
import { formatINR } from "@/lib/pricing";
import { orderStatusLabel, saveOrderEmail } from "@/lib/orders";

interface AccountData {
  name: string;
  email: string;
  phone?: string;
  is_phone_verified?: boolean;
  phone_verified_at?: string;
  is_email_verified?: boolean;
  /** False while WhatsApp is switched off: mobile codes cannot be sent, so no "Verify" prompt. */
  phone_verification_available?: boolean;
  addresses: Array<{
    id: number;
    label: string;
    first_name: string;
    last_name?: string;
    line_1: string;
    city: string;
    state: string;
    postal_code: string;
    is_default: boolean;
  }>;
  orders: Array<{
    id: number;
    uuid: string;
    email?: string;
    order_number: string;
    status: string;
    payment_status: string;
    grand_total: string;
    created_at: string;
    /** GST invoice for paid / confirmed orders (issued the first time it is opened). */
    invoice_url?: string | null;
  }>;
}


export function AccountView() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [token, setToken] = useState("");
  const [account, setAccount] = useState<AccountData | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");
  const router = useRouter();

  // OTP Verification state
  const [pendingOtp, setPendingOtp] = useState<{
    phone: string;
    otpPreview?: string;
  } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpNotice, setOtpNotice] = useState("");

  const [nextPath, setNextPath] = useState<string | null>(null);
  const nextPathRef = useRef<string | null>(null);

  const loadAccount = useCallback(async (currentToken: string) => {
    const url = endpoint("/account");
    if (!url) throw new Error("Account API URL is not configured.");
    const { response, payload } = await requestJson<{ data?: AccountData }>(url, {
      headers: { Accept: "application/json", Authorization: `Bearer ${currentToken}` },
    });
    if (response.status === 401) {
      window.localStorage.removeItem(ACCOUNT_TOKEN_KEY);
      setToken("");
      setAccount(null);
      setNotice("Your session has ended. Please sign in again.");
      return false;
    }
    if (!response.ok || !payload.data) throw new Error(responseMessage(response, payload));
    const data = payload.data;
    data.orders.forEach((order) => saveOrderEmail(order.uuid, order.email || data.email));
    setAccount(data);
    return true;
  }, []);

  const openAccount = useCallback(async (currentToken: string) => {
    setAccountLoading(true);
    setAccountError("");
    try {
      if ((await loadAccount(currentToken)) && nextPathRef.current) router.replace(nextPathRef.current);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Your account could not be loaded.");
    } finally {
      setAccountLoading(false);
    }
  }, [loadAccount, router]);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      nextPathRef.current = safeNextPath(new URLSearchParams(window.location.search).get("next"));
      setNextPath(nextPathRef.current);
      const stored = window.localStorage.getItem(ACCOUNT_TOKEN_KEY) || "";
      if (stored) {
        setToken(stored);
        void openAccount(stored);
      }
    }, 0);
    return () => window.clearTimeout(hydration);
  }, [openAccount]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    const url = endpoint(`/account/${mode}`);
    if (!url) {
      setNotice("Account API URL is not configured.");
      setLoading(false);
      return;
    }
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());

    if (mode === "register") {
      const password = String(body.password ?? "");
      const problem = passwordProblem(password)
        || (password !== String(body.password_confirmation ?? "") ? "The two passwords don't match." : "");
      if (problem) {
        setNotice(problem);
        setLoading(false);
        return;
      }
    }

    try {
      const { response, payload } = await requestJson<{
        token?: string;
        otp_required?: boolean;
        phone?: string;
        otp_preview?: string;
        data?: AccountData;
      }>(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok || !payload.token) throw new Error(responseMessage(response, payload));
      window.localStorage.setItem(ACCOUNT_TOKEN_KEY, payload.token);
      setToken(payload.token);

      if (payload.otp_required) {
        setPendingOtp({
          phone: payload.phone || String(body.phone || ""),
          otpPreview: payload.otp_preview,
        });
        if (payload.otp_preview) {
          setOtpCode(payload.otp_preview);
        }
        void loadAccount(payload.token);
      } else {
        await openAccount(payload.token);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event?: FormEvent) {
    if (event) event.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpNotice("Please enter the 6-digit verification code.");
      return;
    }
    setOtpLoading(true);
    setOtpNotice("");
    const url = endpoint("/account/verify-otp");
    if (!url) {
      setOtpNotice("API endpoint is not configured.");
      setOtpLoading(false);
      return;
    }

    try {
      const { response, payload } = await requestJson<{ message?: string; is_phone_verified?: boolean }>(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp_code: otpCode.trim() }),
      });
      if (!response.ok) throw new Error(responseMessage(response, payload));

      setPendingOtp(null);
      setNotice("Mobile number verified successfully!");
      await openAccount(token);
    } catch (err) {
      setOtpNotice(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOtp() {
    setOtpLoading(true);
    setOtpNotice("");
    const url = endpoint("/account/resend-otp");
    if (!url) return;

    try {
      const { response, payload } = await requestJson<{ message?: string; otp_preview?: string }>(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: pendingOtp?.phone }),
      });
      if (!response.ok) throw new Error(responseMessage(response, payload));

      if (pendingOtp) {
        setPendingOtp({
          ...pendingOtp,
          otpPreview: payload.otp_preview || pendingOtp.otpPreview,
        });
        if (payload.otp_preview) {
          setOtpCode(payload.otp_preview);
        }
      }
      setOtpNotice(payload.message || "A new verification code has been sent.");
    } catch (err) {
      setOtpNotice(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function passwordWasReset(newToken: string) {
    window.localStorage.setItem(ACCOUNT_TOKEN_KEY, newToken);
    setMode("login");
    setToken(newToken);
    await openAccount(newToken);
    setNotice("Your password has been changed and you are signed in.");
  }

  async function socialSignedIn(newToken: string, accountNotice?: string) {
    setNotice("");
    setToken(newToken);
    await openAccount(newToken);
    if (accountNotice) setNotice(accountNotice);
  }

  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setLoading(true);
    setNotice("");
    const url = endpoint("/account/addresses");
    if (!url) {
      setNotice("Account API URL is not configured.");
      setLoading(false);
      return;
    }
    const form = new FormData(formElement);
    try {
      const { response, payload } = await requestJson(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      if (!response.ok) throw new Error(responseMessage(response, payload));
      formElement.reset();
      await loadAccount(token);
      setNotice("Address saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Address could not be saved.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const url = endpoint("/account/logout");
    if (url) {
      await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
    }
    window.localStorage.removeItem(ACCOUNT_TOKEN_KEY);
    setToken("");
    setAccount(null);
    setAccountError("");
    setPendingOtp(null);
  }

  async function deleteAddress(addressId: number) {
    if (!window.confirm("Remove this saved address?")) return;
    const url = endpoint(`/account/addresses/${addressId}`);
    if (!url) return;

    setLoading(true);
    setNotice("");
    try {
      const { response, payload } = await requestJson(url, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(responseMessage(response, payload));
      await loadAccount(token);
      setNotice("Saved address removed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Address could not be removed.");
    } finally {
      setLoading(false);
    }
  }

  // Active OTP verification modal screen
  if (pendingOtp) {
    return (
      <div className="premiumAuthContainer" style={{ maxWidth: "600px" }}>
        <div className="premiumAuthContent" style={{ textAlign: "center", padding: "50px 36px" }}>
          <div style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            background: "#faf6f0",
            border: "1px solid #ebd7bd",
            color: "#a87932",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: "32px",
          }}>
            <i className="ri-shield-check-line"></i>
          </div>

          <h2 style={{ fontSize: "28px", marginBottom: "10px" }}>Verify Your Mobile Number</h2>
          <p style={{ color: "#666", fontSize: "15px", marginBottom: "24px", lineHeight: "1.5" }}>
            We have sent a 6-digit verification OTP code to{" "}
            <strong style={{ color: "#111" }}>+91 {pendingOtp.phone}</strong>.
          </p>

          {pendingOtp.otpPreview && (
            <div style={{
              background: "#fffaf0",
              border: "1px dashed #d4a373",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "24px",
              fontSize: "14px",
              color: "#7f5539",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}>
              <span>
                <strong>Test OTP Code:</strong> {pendingOtp.otpPreview}
              </span>
              <button
                type="button"
                onClick={() => setOtpCode(pendingOtp.otpPreview || "")}
                style={{
                  background: "#7f5539",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Auto-fill
              </button>
            </div>
          )}

          <form onSubmit={handleVerifyOtp}>
            <div className="premiumInputWrap" style={{ marginBottom: "20px" }}>
              <label style={{ letterSpacing: "1.5px", fontSize: "12px", marginBottom: "10px" }}>ENTER 6-DIGIT OTP</label>
              <input
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                autoFocus
                style={{
                  textAlign: "center",
                  fontSize: "28px",
                  letterSpacing: "8px",
                  fontWeight: "700",
                  fontFamily: "monospace",
                  padding: "12px 16px",
                  background: "#fafafa",
                  borderColor: "#d4a373",
                }}
              />
            </div>

            <button
              disabled={otpLoading || otpCode.length !== 6}
              type="submit"
              className="premiumBtn"
              style={{ minHeight: "50px" }}
            >
              {otpLoading ? "Verifying…" : "Verify & Continue"}
            </button>
          </form>

          {otpNotice && (
            <p className="integrationNotice" style={{ marginTop: "20px" }} role="status">
              {otpNotice}
            </p>
          )}

          <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
            <button
              type="button"
              disabled={otpLoading}
              onClick={handleResendOtp}
              style={{
                background: "none",
                border: "none",
                color: "#a87932",
                fontWeight: "600",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Resend OTP
            </button>

            <button
              type="button"
              onClick={() => {
                setPendingOtp(null);
                void openAccount(token);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
              }}
            >
              Verify Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (account && nextPath) {
    return (
      <div className="accountDashboard">
        <p className="accountEmpty" role="status">
          {nextPath === "/checkout" ? "Taking you to checkout…" : "Signed in. Taking you back…"}
        </p>
      </div>
    );
  }

  if (account) {
    return (
      <div className="accountDashboard">
        <style>{`
          .userMetaRow {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 6px;
          }
          .phoneBadge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
          }
          .phoneBadge.verified {
            background: #e8f5e9;
            color: #2e7d32;
            border: 1px solid #c8e6c9;
          }
          .phoneBadge.unverified {
            background: #fff3e0;
            color: #e65100;
            border: 1px solid #ffe0b2;
          }
          .verifyNowInline {
            background: #201611;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 2px 8px;
            font-size: 11px;
            margin-left: 6px;
            cursor: pointer;
          }
        `}</style>
        <div className="accountDashboardHead">
          <div>
            <span className="eyebrow">Customer account</span>
            <h1>Hello, {account.name}</h1>
            <div className="userMetaRow">
              <span style={{ color: "#666" }}>{account.email}</span>
              {account.is_email_verified && (
                <span className="phoneBadge verified" title="Email address is verified">
                  <i className="ri-checkbox-circle-fill"></i> Verified
                </span>
              )}
              {account.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>·</span>
                  <span style={{ fontWeight: 500 }}>{account.phone}</span>
                  {account.is_phone_verified ? (
                    <span className="phoneBadge verified" title="Mobile number is verified">
                      <i className="ri-checkbox-circle-fill"></i> Verified
                    </span>
                  ) : account.phone_verification_available === false ? null : (
                    <span className="phoneBadge unverified" title="Mobile number not verified">
                      <i className="ri-error-warning-fill"></i> Unverified
                      <button
                        type="button"
                        onClick={() => {
                          setPendingOtp({ phone: account.phone || "" });
                          void handleResendOtp();
                        }}
                        className="verifyNowInline"
                      >
                        Verify OTP
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button className="button buttonOutline" onClick={() => void logout()}>
            Sign out
          </button>
        </div>

        {notice && <p className="integrationNotice" role="status">{notice}</p>}

        {account.is_email_verified === false && (
          <EmailVerificationCard
            email={account.email}
            token={token}
            onVerified={() => {
              setAccount({ ...account, is_email_verified: true });
              setNotice("Email address verified.");
            }}
          />
        )}

        <div className="accountDashboardGrid">
          <section className="accountPanel" id="orders">
            <h2>Order history</h2>
            {account.orders.length ? (
              <div className="accountOrders">
                {account.orders.map((order) => (
                  <div key={order.id} className="accountOrderItem">
                    <Link
                      className="accountOrderMain"
                      href={`/orders/${order.uuid}`}
                      onClick={() => saveOrderEmail(order.uuid, order.email || account.email)}
                    >
                      <span>
                        <b>{order.order_number}</b>
                        <small>{new Date(order.created_at).toLocaleDateString("en-IN")}</small>
                      </span>
                      <span>
                        <b>{formatINR(Number(order.grand_total))}</b>
                        <small>{orderStatusLabel(order.status)}</small>
                      </span>
                    </Link>
                    {order.invoice_url && (
                      <a className="accountOrderInvoice" href={order.invoice_url} target="_blank" rel="noopener noreferrer">
                        <i className="ri-file-text-line" aria-hidden="true" /> Download GST invoice
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="accountEmpty">Your orders will appear here after checkout.</p>
            )}
          </section>

          <section className="accountPanel">
            <h2>Saved addresses</h2>
            {account.addresses.map((address) => (
              <address key={address.id}>
                <b>
                  {address.label}
                  {address.is_default ? " · Default" : ""}
                </b>
                <span>
                  {address.first_name} {address.last_name}
                  <br />
                  {address.line_1}
                  <br />
                  {address.city}, {address.state} {address.postal_code}
                </span>
                <button type="button" disabled={loading} onClick={() => void deleteAddress(address.id)}>
                  Remove
                </button>
              </address>
            ))}

            <details className="addressCreator">
              <summary>Add a new address</summary>
              <form className="formGrid" onSubmit={addAddress}>
                <label>
                  Label
                  <input name="label" defaultValue="Home" />
                </label>
                <label>
                  First name
                  <input required name="first_name" />
                </label>
                <label>
                  Last name
                  <input name="last_name" />
                </label>
                <label>
                  Phone
                  <input required name="phone" />
                </label>
                <label className="fullField">
                  Address
                  <input required name="line_1" />
                </label>
                <label>
                  City
                  <input required name="city" />
                </label>
                <label>
                  State
                  <input required name="state" />
                </label>
                <label>
                  PIN code
                  <input required pattern="[1-9][0-9]{5}" name="postal_code" />
                </label>
                <label className="checkField">
                  <input type="checkbox" name="is_default" value="1" /> Make default
                </label>
                <button disabled={loading} className="button buttonDark" type="submit">
                  Save address
                </button>
              </form>
            </details>
          </section>
        </div>
      </div>
    );
  }

  // Signed in but the account isn't on screen yet: don't flash the sign-in form.
  if (token) {
    return (
      <div className="accountDashboard">
        {accountError ? (
          <>
            <p className="integrationNotice" role="alert">{accountError}</p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                className="button buttonDark"
                type="button"
                disabled={accountLoading}
                onClick={() => void openAccount(token)}
              >
                {accountLoading ? "Trying again…" : "Try again"}
              </button>
              <button className="button buttonOutline" type="button" onClick={() => void logout()}>
                Sign out
              </button>
            </div>
          </>
        ) : (
          <p className="accountEmpty" role="status">Loading your account…</p>
        )}
      </div>
    );
  }

  return (
    <>
      <style>{`
        .premiumAuthContainer {
          display: flex;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          background: #ffffff;
          max-width: 1000px;
          margin: 40px auto;
          min-height: 600px;
        }
        .premiumAuthImage {
          flex: 1;
          background: url('/assets/img/login-img.jpg') center/cover no-repeat;
          position: relative;
          display: none;
        }
        @media (min-width: 900px) {
          .premiumAuthImage {
            display: block;
          }
        }
        .premiumAuthImage::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%);
        }
        .premiumAuthContent {
          flex: 1;
          padding: 60px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #fff;
        }
        .premiumAuthContent h2 {
          font-family: var(--serif);
          font-size: 36px;
          margin-bottom: 30px;
          color: #111;
        }
        .premiumInputWrap {
          margin-bottom: 20px;
        }
        .premiumInputWrap label {
          display: block;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          color: #555;
        }
        .premiumInputWrap input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: #fdfdfd;
        }
        .premiumInputWrap input:focus {
          border-color: #111;
          outline: none;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(0,0,0,0.05);
        }
        .premiumBtn {
          width: 100%;
          padding: 16px;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
          margin-top: 10px;
        }
        .premiumBtn:hover {
          background: #333;
          transform: translateY(-2px);
        }
        .premiumSwitch {
          text-align: center;
          margin-top: 30px;
          font-size: 15px;
          color: #666;
        }
        .premiumSwitch button {
          background: none;
          border: none;
          color: #111;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          margin-left: 8px;
        }
        .authBenefitsList {
          margin-bottom: 30px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 12px;
        }
        .authBenefitsList h3 {
          font-size: 16px;
          margin-bottom: 15px;
        }
        .authBenefitsList ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .authBenefitsList li {
          font-size: 14px;
          color: #555;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .authBenefitsList li i {
          color: var(--accent-color);
          font-size: 18px;
        }
      `}</style>

      <div className="premiumAuthContainer">
        <div className="premiumAuthImage"></div>
        <div className="premiumAuthContent">
          {mode === "forgot" ? (
            <ForgotPasswordForm
              onDone={(newToken) => void passwordWasReset(newToken)}
              onBack={() => { setMode("login"); setNotice(""); }}
            />
          ) : (
          <>
          <h2>{mode === "login" ? "Sign in" : "Create an account"}</h2>
          {nextPath && (
            <p className="integrationNotice" role="status" style={{ marginTop: "-12px", marginBottom: "24px" }}>
              {nextPath === "/checkout"
                ? "Sign in or create an account to place your order. Your bag is saved."
                : "Please sign in or create an account to continue."}
            </p>
          )}

          {mode === "register" && (
            <div className="authBenefitsList">
              <h3>Unlock Exclusive Benefits</h3>
              <ul>
                <li><i className="ri-truck-line"></i> Faster checkout process</li>
                <li><i className="ri-history-line"></i> Track your order history</li>
                <li><i className="ri-shield-check-line"></i> Secure, verified account</li>
                <li><i className="ri-heart-3-line"></i> Save your favourite pieces</li>
              </ul>
            </div>
          )}

          <SocialLoginButtons onSignedIn={socialSignedIn} disabled={loading} />

          <form onSubmit={authenticate}>
            {mode === "register" && (
              <>
                <div className="premiumInputWrap">
                  <label>Full Name</label>
                  <input required name="name" autoComplete="name" placeholder="E.g. Jane Doe" />
                </div>
                <div className="premiumInputWrap">
                  <label>Mobile Number</label>
                  <input
                    required
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="E.g. 9876543210"
                    pattern="[0-9]{10,15}"
                    title="Please enter a valid 10-digit mobile number"
                  />
                </div>
              </>
            )}

            <div className="premiumInputWrap">
              <label>Email Address</label>
              <input required name="email" type="email" autoComplete="email" placeholder="jane@example.com" />
            </div>

            <div className="premiumInputWrap">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  required
                  minLength={8}
                  name="password"
                  aria-describedby={mode === "register" ? "password-hint" : undefined}
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  style={{ paddingRight: "40px", width: "100%" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} style={{ fontSize: "18px" }}></i>
                </button>
              </div>
              {mode === "register" && (
                <small id="password-hint" style={{ display: "block", marginTop: "6px", color: "#666", fontSize: "13px" }}>
                  At least 8 characters, with letters and numbers.
                </small>
              )}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setNotice(""); }}
                  style={{ display: "block", marginTop: "8px", marginLeft: "auto", background: "none", border: "none", padding: 0, color: "#a87932", fontSize: "14px", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {mode === "register" && (
              <div className="premiumInputWrap">
                <label>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    required
                    minLength={8}
                    name="password_confirmation"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    style={{ paddingRight: "40px", width: "100%" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#666",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} style={{ fontSize: "18px" }}></i>
                  </button>
                </div>
              </div>
            )}

            <button disabled={loading} type="submit" className="premiumBtn">
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {notice && <p className="integrationNotice" style={{ marginTop: "20px", textAlign: "center" }} role="alert">{notice}</p>}

          <div className="premiumSwitch">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setNotice("");
              }}
            >
              {mode === "login" ? "Create one now" : "Sign in"}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </>
  );
}
