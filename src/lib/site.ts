export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Jewlfy",
  description:
    "Fine jewellery crafted with certified metals, transparent pricing and timeless design.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "care@example.com",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+91 00000 00000",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
};
