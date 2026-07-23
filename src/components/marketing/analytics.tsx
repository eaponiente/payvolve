"use client";

import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js) — mounted only on the public marketing pages
 * (via MarketingFooter), never inside the authenticated `(app)` area, so
 * payslip/employee URLs never reach Google. Renders nothing unless
 * NEXT_PUBLIC_GA_ID is set, so local dev doesn't pollute the property.
 */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
