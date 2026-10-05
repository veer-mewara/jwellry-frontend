import Script from "next/script";

// GA measurement ids look like G-XXXXXXX; reject anything else since it is inlined into a script.
const MEASUREMENT_ID = /^[A-Z]{1,4}-[A-Z0-9-]{4,20}$/i;

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  if (!measurementId || !MEASUREMENT_ID.test(measurementId)) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}', { anonymize_ip: true });
      `}</Script>
    </>
  );
}
