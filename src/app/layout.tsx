/* eslint-disable @next/next/no-css-tags */

import type { Metadata } from "next";
import "./globals.css";
import { TemplateFooter, TemplateHeader } from "@/components/index2-home";
import { StoreProvider } from "@/components/store-provider";
import { WhatsappButton } from "@/components/whatsapp-button";
import { GoogleAnalytics } from "@/components/google-analytics";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { getPublicSettings } from "@/lib/public-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getPublicSettings();
  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} | Fine Jewellery`,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    keywords: [
      "fine jewellery",
      "gold jewellery",
      "diamond rings",
      "hallmarked jewellery",
      "jewellery online India",
    ],
    openGraph: {
      type: "website",
      title: site.name,
      description: site.description,
      siteName: site.name,
      images: ["/assets/img/hero-bg-1.jpg"],
    },
    verification: {
      google: site.googleSiteVerification || undefined,
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getPublicSettings();

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/swiper.min.css" />
        <link rel="stylesheet" href="/assets/css/remixicon.min.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
      </head>
      <body>
        <SiteSettingsProvider settings={settings}>
          <StoreProvider>
            <TemplateHeader />
            <main className="storefrontMain">{children}</main>
            <TemplateFooter />
            <WhatsappButton />
          </StoreProvider>
        </SiteSettingsProvider>
        <GoogleAnalytics measurementId={settings.site.gaMeasurementId} />
      </body>
    </html>
  );
}
