"use client";

import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function WhatsappButton() {
  const href = siteConfig.whatsappNumber
    ? `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hello, I would like help choosing a jewellery piece.")}`
    : "/custom-jewellery";

  return (
    <Link
      href={href}
      target={siteConfig.whatsappNumber ? "_blank" : undefined}
      rel={siteConfig.whatsappNumber ? "noreferrer" : undefined}
      aria-label="Chat with our jewellery concierge"
      style={{
        position: 'fixed',
        zIndex: 50,
        right: '24px',
        bottom: '24px',
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        backgroundColor: '#25D366',
        borderRadius: '50%',
        boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4)',
        fontSize: '32px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(37, 211, 102, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 211, 102, 0.4)';
      }}
    >
      <i className="ri-whatsapp-line"></i>
    </Link>
  );
}
