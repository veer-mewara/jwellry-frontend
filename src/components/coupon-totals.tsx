import { formatINR } from "@/lib/pricing";
import type { CouponPreview } from "@/lib/coupon-preview";

/** Subtotal / Discount / Total rows shared by the cart and checkout summaries. */
export function CouponTotals({
  subtotal,
  preview,
  checking = false,
}: {
  subtotal: number;
  preview: CouponPreview | null;
  checking?: boolean;
}) {
  const applied = !checking && preview?.valid ? preview : null;

  return (
    <>
      <div><span>Subtotal</span><b>{formatINR(applied ? applied.subtotal : subtotal)}</b></div>
      {checking && (
        <div className="discountLine"><span>Discount</span><b>Checking coupon…</b></div>
      )}
      {applied && (
        <div className="discountLine">
          <span>Discount ({applied.code})</span>
          <b>−{formatINR(applied.discount)}</b>
        </div>
      )}
    </>
  );
}

export function couponTotal(subtotal: number, preview: CouponPreview | null) {
  return preview?.valid ? preview.total : subtotal;
}
