/* eslint-disable @next/next/no-css-tags */

import type { Metadata } from "next";
import "./globals.css";
import { TemplateFooter, TemplateHeader } from "@/components/index2-home";
import { StoreProvider } from "@/components/store-provider";
import { WhatsappButton } from "@/components/whatsapp-button";
import { GoogleAnalytics } from "@/components/google-analytics";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Fine Jewellery`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "fine jewellery",
    "gold jewellery",
    "diamond rings",
    "hallmarked jewellery",
    "jewellery online India",
  ],
  openGraph: {
    type: "website",
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: ["/assets/img/hero-bg-1.jpg"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/swiper.min.css" />
        <link rel="stylesheet" href="/assets/css/remixicon.min.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
      </head>
      <body>
        <StoreProvider>
          <TemplateHeader />
          <main className="storefrontMain">{children}</main>
          <TemplateFooter />
          <WhatsappButton />
        </StoreProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
