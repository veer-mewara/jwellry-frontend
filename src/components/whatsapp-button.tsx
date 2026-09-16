import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function WhatsappButton() {
  const href = siteConfig.whatsappNumber
    ? `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hello, I would like help choosing a jewellery piece.")}`
    : "/custom-jewellery";

  return (
    <Link
      className="whatsappButton"
      href={href}
      target={siteConfig.whatsappNumber ? "_blank" : undefined}
      rel={siteConfig.whatsappNumber ? "noreferrer" : undefined}
      aria-label="Chat with our jewellery concierge"
    >
      <span>WA</span>
      <b>Enquire</b>
    </Link>
  );
}
