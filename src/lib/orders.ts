export const ORDER_EMAILS_KEY = "sonaro_order_emails_v1";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Payment pending",
  confirmed: "Confirmed",
  processing: "Packing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  payment_failed: "Payment failed",
};

export function orderStatusLabel(status: string) {
  return (
    ORDER_STATUS_LABELS[status] ||
    status.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase())
  );
}

function readEmails(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(ORDER_EMAILS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveOrderEmail(uuid: string, email: string) {
  try {
    window.localStorage.setItem(
      ORDER_EMAILS_KEY,
      JSON.stringify({ ...readEmails(), [uuid]: email }),
    );
  } catch {
    // Storage can be unavailable (private mode); the order page will ask for the email.
  }
}

export function getSavedOrderEmail(uuid: string) {
  return readEmails()[uuid] || "";
}
