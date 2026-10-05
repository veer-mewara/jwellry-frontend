import type { Metadata } from "next";
import { OrderView } from "@/components/order-view";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { uuid } = await params;
  const query = await searchParams;
  const email = Array.isArray(query.email) ? query.email[0] : query.email;
  const placed = (Array.isArray(query.placed) ? query.placed[0] : query.placed) === "1";

  return (
    <div className="pageShell">
      <div className="container pageIntro compactIntro">
        <span className="eyebrow">Order status</span>
        <h1>Your order</h1>
      </div>
      <div className="container">
        <OrderView uuid={uuid} queryEmail={email || ""} placed={placed} />
      </div>
    </div>
  );
}
