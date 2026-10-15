/** Small helpers shared by the account screens (sign in, forgot password, verification). */

export interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
}

const NETWORK_ERROR = "We couldn't reach the store. Check your connection and try again.";

export function endpoint(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return base ? `${base}/api${path}` : null;
}

/** fetch + JSON that never surfaces "Failed to fetch" or a JSON parse error to the shopper. */
export async function requestJson<T>(url: string, init: RequestInit): Promise<{ response: Response; payload: T & ApiError }> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error(NETWORK_ERROR);
  }
  const payload = (await response.json().catch(() => ({}))) as T & ApiError;
  return { response, payload };
}

export function responseMessage(response: Response, payload: ApiError) {
  const message = (payload.errors && Object.values(payload.errors).flat()[0]) || payload.message;
  if (message) return message;
  if (response.status === 429) return "Too many tries. Please wait a minute and try again.";
  return response.status >= 500 ? "The store is having trouble right now. Please try again in a moment." : "Please try again.";
}

export function passwordProblem(password: string) {
  if (password.length < 8) return "Your password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Your password must contain both letters and numbers.";
  return "";
}

export function jsonHeaders(token?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
