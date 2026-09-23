"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ACCOUNT_TOKEN_KEY } from "@/lib/account";
import { formatINR } from "@/lib/pricing";

interface AccountData {
  name: string;
  email: string;
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
    order_number: string;
    status: string;
    payment_status: string;
    grand_total: string;
    created_at: string;
  }>;
}

function endpoint(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return base ? `${base}/api${path}` : null;
}

function responseMessage(payload: { message?: string; errors?: Record<string, string[]> }) {
  return (payload.errors && Object.values(payload.errors).flat()[0]) || payload.message || "Please try again.";
}

export function AccountView() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [token, setToken] = useState("");
  const [account, setAccount] = useState<AccountData | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loadAccount = useCallback(async (currentToken: string) => {
    const url = endpoint("/account");
    if (!url) return;
    const response = await fetch(url, {
      headers: { Accept: "application/json", Authorization: `Bearer ${currentToken}` },
    });
    if (!response.ok) {
      window.localStorage.removeItem(ACCOUNT_TOKEN_KEY);
      setToken("");
      return;
    }
    const payload = (await response.json()) as { data: AccountData };
    setAccount(payload.data);
  }, []);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      const stored = window.localStorage.getItem(ACCOUNT_TOKEN_KEY) || "";
      if (stored) {
        setToken(stored);
        void loadAccount(stored);
      }
    }, 0);
    return () => window.clearTimeout(hydration);
  }, [loadAccount]);

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

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        token?: string;
        message?: string;
        errors?: Record<string, string[]>;
      };
      if (!response.ok || !payload.token) throw new Error(responseMessage(payload));
      window.localStorage.setItem(ACCOUNT_TOKEN_KEY, payload.token);
      setToken(payload.token);
      await loadAccount(payload.token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
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
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const payload = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
      if (!response.ok) throw new Error(responseMessage(payload));
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
  }

  async function deleteAddress(addressId: number) {
    if (!window.confirm("Remove this saved address?")) return;
    const url = endpoint(`/account/addresses/${addressId}`);
    if (!url) return;

    setLoading(true);
    setNotice("");
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
        throw new Error(responseMessage(payload));
      }
      await loadAccount(token);
      setNotice("Saved address removed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Address could not be removed.");
    } finally {
      setLoading(false);
    }
  }

  if (account) {
    return (
      <div className="accountDashboard">
        <div className="accountDashboardHead"><div><span className="eyebrow">Customer account</span><h1>Hello, {account.name}</h1><p>{account.email}</p></div><button className="button buttonOutline" onClick={() => void logout()}>Sign out</button></div>
        {notice && <p className="integrationNotice" role="status">{notice}</p>}
        <div className="accountDashboardGrid">
          <section className="accountPanel"><h2>Order history</h2>{account.orders.length ? <div className="accountOrders">{account.orders.map((order) => <div key={order.id}><span><b>{order.order_number}</b><small>{new Date(order.created_at).toLocaleDateString("en-IN")}</small></span><span><b>{formatINR(Number(order.grand_total))}</b><small>{order.status.replaceAll("_", " ")}</small></span></div>)}</div> : <p className="accountEmpty">Your orders will appear here after checkout.</p>}</section>
          <section className="accountPanel"><h2>Saved addresses</h2>{account.addresses.map((address) => <address key={address.id}><b>{address.label}{address.is_default ? " · Default" : ""}</b><span>{address.first_name} {address.last_name}<br />{address.line_1}<br />{address.city}, {address.state} {address.postal_code}</span><button type="button" disabled={loading} onClick={() => void deleteAddress(address.id)}>Remove</button></address>)}<details className="addressCreator"><summary>Add a new address</summary><form className="formGrid" onSubmit={addAddress}><label>Label<input name="label" defaultValue="Home" /></label><label>First name<input required name="first_name" /></label><label>Last name<input name="last_name" /></label><label>Phone<input required name="phone" /></label><label className="fullField">Address<input required name="line_1" /></label><label>City<input required name="city" /></label><label>State<input required name="state" /></label><label>PIN code<input required pattern="[1-9][0-9]{5}" name="postal_code" /></label><label className="checkField"><input type="checkbox" name="is_default" value="1" /> Make default</label><button disabled={loading} className="button buttonDark" type="submit">Save address</button></form></details></section>
        </div>
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
          <h2>{mode === "login" ? "Sign in" : "Create an account"}</h2>
          
          {mode === "register" && (
            <div className="authBenefitsList">
              <h3>Unlock Exclusive Benefits</h3>
              <ul>
                <li><i className="ri-truck-line"></i> Faster checkout process</li>
                <li><i className="ri-history-line"></i> Track your order history</li>
                <li><i className="ri-heart-3-line"></i> Save your favourite pieces</li>
              </ul>
            </div>
          )}

          <form onSubmit={authenticate}>
            {mode === "register" && (
              <div className="premiumInputWrap">
                <label>Full Name</label>
                <input required name="name" autoComplete="name" placeholder="E.g. Jane Doe" />
              </div>
            )}
            <div className="premiumInputWrap">
              <label>Email Address</label>
              <input required name="email" type="email" autoComplete="email" placeholder="jane@example.com" />
            </div>
            <div className="premiumInputWrap">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input required minLength={8} name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="••••••••" style={{ paddingRight: "40px", width: "100%" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#666", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }} aria-label={showPassword ? "Hide password" : "Show password"}>
                  <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} style={{ fontSize: "18px" }}></i>
                </button>
              </div>
            </div>
            {mode === "register" && (
              <div className="premiumInputWrap">
                <label>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <input required minLength={8} name="password_confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" style={{ paddingRight: "40px", width: "100%" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#666", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }} aria-label={showPassword ? "Hide password" : "Show password"}>
                    <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} style={{ fontSize: "18px" }}></i>
                  </button>
                </div>
              </div>
            )}
            <button disabled={loading} type="submit" className="premiumBtn">
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
          
          {notice && <p className="integrationNotice" style={{ marginTop: '20px', textAlign: 'center' }} role="alert">{notice}</p>}

          <div className="premiumSwitch">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setNotice(""); }}>
              {mode === "login" ? "Create one now" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
