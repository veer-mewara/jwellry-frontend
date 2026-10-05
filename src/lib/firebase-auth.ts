// Client-only helpers for "Continue with Google/Facebook".
// Firebase is imported dynamically so it only loads on screens that show the buttons.
// Firebase is used just to prove identity: its ID token is exchanged for a backend
// token (the real session) and the Firebase session is discarded immediately.

import type { Auth, AuthProvider, UserCredential } from "firebase/auth";
import { ACCOUNT_TOKEN_KEY } from "@/lib/account";
import type { FirebaseWebConfig } from "@/lib/public-settings";

export type SocialProvider = "google" | "facebook";

export type SocialLoginResult =
  | { kind: "signed-in"; token: string; notice?: string }
  | { kind: "cancelled" }
  | { kind: "redirecting" };

/** An error whose message is safe to show to the shopper. */
export class SocialLoginError extends Error {}

const APP_NAME = "storefront-social-login";
const REDIRECT_FLAG = "sonaro_social_redirect_v1";

type AuthModule = typeof import("firebase/auth");
interface FirebaseHandle {
  auth: Auth;
  mod: AuthModule;
}

let handle: Promise<FirebaseHandle> | null = null;
let handleKey = "";

/** Loads and initialises Firebase once; call early (e.g. on mount) so a click can open the popup immediately. */
export function preloadFirebaseAuth(config: FirebaseWebConfig): Promise<FirebaseHandle> {
  const key = `${config.projectId}:${config.appId}`;
  if (handle && handleKey === key) return handle;
  handleKey = key;
  handle = (async () => {
    const [{ initializeApp, getApps }, mod] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
    const app = getApps().find((item) => item.name === APP_NAME) ?? initializeApp(config, APP_NAME);
    return { auth: mod.getAuth(app), mod };
  })();
  handle.catch(() => {
    handle = null;
  });
  return handle;
}

function providerFor(mod: AuthModule, provider: SocialProvider): AuthProvider {
  if (provider === "facebook") {
    const facebook = new mod.FacebookAuthProvider();
    facebook.addScope("email");
    return facebook;
  }
  const google = new mod.GoogleAuthProvider();
  google.setCustomParameters({ prompt: "select_account" });
  return google;
}

function errorCode(error: unknown): string {
  return typeof error === "object" && error && "code" in error && typeof error.code === "string" ? error.code : "";
}

async function exchangeIdToken(idToken: string): Promise<{ token: string; notice?: string }> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) throw new SocialLoginError("Account API URL is not configured.");

  let response: Response;
  try {
    response = await fetch(`${base}/api/account/social-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });
  } catch {
    throw new SocialLoginError("We couldn't reach the server. Check your connection and try again.");
  }

  const payload = (await response.json().catch(() => ({}))) as { token?: string; message?: string; account_notice?: string };
  if (response.ok && payload.token) return { token: payload.token, notice: payload.account_notice || undefined };
  if (response.status === 503) {
    throw new SocialLoginError(payload.message || "Social sign-in is not available right now. Please use your email and password.");
  }
  if (response.status === 422) {
    throw new SocialLoginError(payload.message || "We couldn't verify that account. Please try again.");
  }
  throw new SocialLoginError(payload.message || "Sign in failed. Please try again.");
}

async function finish(fb: FirebaseHandle, credential: UserCredential): Promise<SocialLoginResult> {
  try {
    const idToken = await credential.user.getIdToken();
    const { token, notice } = await exchangeIdToken(idToken);
    // Stored exactly like the email/password login.
    window.localStorage.setItem(ACCOUNT_TOKEN_KEY, token);
    return { kind: "signed-in", token, notice };
  } finally {
    // The backend token is the session; never keep a Firebase session around.
    await fb.mod.signOut(fb.auth).catch(() => undefined);
  }
}

export async function signInWithSocial(config: FirebaseWebConfig, provider: SocialProvider): Promise<SocialLoginResult> {
  const fb = await preloadFirebaseAuth(config);
  const authProvider = providerFor(fb.mod, provider);

  let credential: UserCredential;
  try {
    credential = await fb.mod.signInWithPopup(fb.auth, authProvider);
  } catch (error) {
    const code = errorCode(error);
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request" || code === "auth/user-cancelled") {
      return { kind: "cancelled" };
    }
    if (code === "auth/popup-blocked") {
      try {
        window.sessionStorage.setItem(REDIRECT_FLAG, provider);
      } catch {
        // Without the flag the redirect result is still picked up on the next visit.
      }
      await fb.mod.signInWithRedirect(fb.auth, authProvider);
      return { kind: "redirecting" };
    }
    throw error;
  }
  return finish(fb, credential);
}

/** Completes a sign-in that fell back to a full-page redirect. Only loads Firebase if a redirect is pending. */
export async function completeSocialRedirect(config: FirebaseWebConfig): Promise<SocialLoginResult | null> {
  let pending = false;
  try {
    pending = Boolean(window.sessionStorage.getItem(REDIRECT_FLAG));
    window.sessionStorage.removeItem(REDIRECT_FLAG);
  } catch {
    return null;
  }
  if (!pending) return null;

  const fb = await preloadFirebaseAuth(config);
  const credential = await fb.mod.getRedirectResult(fb.auth);
  if (!credential) return null;
  return finish(fb, credential);
}

/** Maps any sign-in failure to a message for the shopper, or null when there is nothing to show. */
export function socialLoginErrorMessage(error: unknown, provider?: SocialProvider): string | null {
  if (error instanceof SocialLoginError) return error.message;
  const label = provider === "facebook" ? "Facebook" : provider === "google" ? "Google" : "this account";
  switch (errorCode(error)) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return null;
    case "auth/account-exists-with-different-credential":
      return "This email is already linked to another sign-in method. Use that method or your password.";
    case "auth/network-request-failed":
      return "We couldn't reach the sign-in service. Check your connection and try again.";
    case "auth/unauthorized-domain":
    case "auth/operation-not-allowed":
    case "auth/invalid-api-key":
      return `Sign in with ${label} is not available right now. Please use your email and password.`;
    case "auth/user-disabled":
      return `This ${label} account has been disabled.`;
    default:
      return `Sign in with ${label} failed. Please try again.`;
  }
}
