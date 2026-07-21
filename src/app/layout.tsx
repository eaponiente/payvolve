import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://pondoflow.com";
const title = "PondoFlow — Payroll for PH Teams";
const description =
  "Automated payroll, attendance, and payslips for Philippine businesses. SSS, PhilHealth, Pag-IBIG, and BIR withholding computed for you every cutoff.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s — PondoFlow" },
  description,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PondoFlow" },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: siteUrl,
    siteName: "PondoFlow",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        {children}
      </body>
    </html>
  );
}
