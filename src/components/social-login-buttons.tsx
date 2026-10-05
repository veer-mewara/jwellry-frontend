"use client";

import { useEffect, useRef, useState } from "react";
import { usePublicSettings } from "@/components/site-settings-provider";
import {
  completeSocialRedirect,
  preloadFirebaseAuth,
  signInWithSocial,
  socialLoginErrorMessage,
  type SocialProvider,
} from "@/lib/firebase-auth";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24">
      <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
      <path fill="#fff" d="M16.67 15.56l.53-3.49h-3.33V9.82c0-.96.47-1.89 1.96-1.89h1.51V4.96s-1.37-.24-2.68-.24c-2.74 0-4.53 1.67-4.53 4.69v2.66H7.08v3.49h3.05V24a12.2 12.2 0 003.74 0v-8.44h2.8z" />
    </svg>
  );
}

const LABELS: Record<SocialProvider, string> = { google: "Google", facebook: "Facebook" };

/**
 * "Continue with Google/Facebook" buttons plus an "or" divider.
 * Renders nothing unless Firebase is configured in Admin settings and the provider is enabled.
 */
export function SocialLoginButtons({
  onSignedIn,
  disabled = false,
  divider = true,
}: {
  onSignedIn: (token: string) => void | Promise<void>;
  disabled?: boolean;
  divider?: boolean;
}) {
  const { auth } = usePublicSettings();
  const firebase = auth.firebase;
  const providers = (["google", "facebook"] as const).filter((provider) => auth.providers[provider]);
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");
  const onSignedInRef = useRef(onSignedIn);

  useEffect(() => {
    onSignedInRef.current = onSignedIn;
  }, [onSignedIn]);

  const enabled = Boolean(firebase && providers.length);

  useEffect(() => {
    if (!firebase || !enabled) return;
    let active = true;
    // Warm up Firebase so the click opens the popup without waiting on a download
    // (some browsers block popups that open too long after the click).
    preloadFirebaseAuth(firebase).catch(() => undefined);
    completeSocialRedirect(firebase)
      .then(async (result) => {
        if (active && result?.kind === "signed-in") await onSignedInRef.current(result.token);
      })
      .catch((caught: unknown) => {
        if (active) setError(socialLoginErrorMessage(caught) ?? "");
      });
    return () => {
      active = false;
    };
  }, [firebase, enabled]);

  if (!firebase || !enabled) return null;

  async function start(provider: SocialProvider) {
    if (!firebase) return;
    setBusy(provider);
    setError("");
    try {
      const result = await signInWithSocial(firebase, provider);
      if (result.kind === "signed-in") await onSignedIn(result.token);
      if (result.kind === "redirecting") return; // Page is navigating away; keep the loading state.
    } catch (caught) {
      setError(socialLoginErrorMessage(caught, provider) ?? "");
    }
    setBusy(null);
  }

  return (
    <div className="socialLogin">
      <style>{`
        .socialLogin { margin-bottom: 24px; }
        .socialLoginButtons { display: grid; gap: 12px; }
        .socialLoginButton {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 14px 16px;
          background: #fff;
          color: #111;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
        }
        .socialLoginButton:hover:not(:disabled) { border-color: #111; background: #fafafa; transform: translateY(-2px); }
        .socialLoginButton:focus-visible { outline: none; border-color: #111; box-shadow: 0 0 0 4px rgba(0,0,0,0.08); }
        .socialLoginButton:disabled { cursor: not-allowed; opacity: 0.65; }
        .socialLoginDivider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          color: #888;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .socialLoginDivider::before, .socialLoginDivider::after { content: ""; flex: 1; height: 1px; background: #e5e5e5; }
      `}</style>
      <div className="socialLoginButtons">
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            className="socialLoginButton"
            disabled={disabled || busy !== null}
            aria-busy={busy === provider}
            onClick={() => void start(provider)}
          >
            {provider === "google" ? <GoogleIcon /> : <FacebookIcon />}
            <span>{busy === provider ? "Connecting…" : `Continue with ${LABELS[provider]}`}</span>
          </button>
        ))}
      </div>
      {error && <p className="integrationNotice" style={{ marginTop: "16px", textAlign: "center" }} role="alert">{error}</p>}
      {divider && <div className="socialLoginDivider" role="separator" aria-label="or">or</div>}
    </div>
  );
}
