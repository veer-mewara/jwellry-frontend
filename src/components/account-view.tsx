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
    <div className="accountGrid">
      <section className="accountLogin">
        <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
        <form onSubmit={authenticate}>
          {mode === "register" && <label>Your name<input required name="name" autoComplete="name" /></label>}
          <label>Email address<input required name="email" type="email" autoComplete="email" /></label>
          <label>Password<input required minLength={8} name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
          {mode === "register" && <label>Confirm password<input required minLength={8} name="password_confirmation" type="password" autoComplete="new-password" /></label>}
          <button disabled={loading} type="submit" className="button buttonDark">{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        {notice && <p className="integrationNotice" role="alert">{notice}</p>}
      </section>
      <aside className="accountBenefits">
        <h2>Your account keeps everything together.</h2>
        <div><b>Orders</b><span>View payment and fulfilment status.</span></div><div><b>Addresses</b><span>Save home, work and gifting addresses.</span></div><div><b>Wishlist</b><span>Keep your shortlist on this device.</span></div><div><b>Support</b><span>Ask for help against a specific order.</span></div>
        <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setNotice(""); }} className="button buttonOutline">{mode === "login" ? "Create an account" : "I already have an account"}</button>
      </aside>
    </div>
  );
}
