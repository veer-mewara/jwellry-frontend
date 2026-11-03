export const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let loading: Promise<boolean> | null = null;

/**
 * Loads Razorpay's checkout script once. Calls made while it loads share the same wait; if it fails,
 * the tag is removed so the next try starts afresh instead of waiting forever on a dead script.
 */
export function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  if (loading) return loading;

  loading = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      script.remove();
      loading = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return loading;
}

/** Tests only: forget a load in progress. */
export function resetRazorpayLoader() {
  loading = null;
}
