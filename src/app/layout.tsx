import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppToaster } from "@/components/ui/toaster";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tandem — a spending tracker for two",
    template: "%s · Tandem",
  },
  description:
    "Tandem is a calm, shared spending tracker for couples. See where your money goes, understand household spending, and keep your budgets in sync.",
  applicationName: "Tandem",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tandem",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Tandem — money, in sync",
    description:
      "A shared spending tracker for couples. Budgets, fair splits and clear insights, built for two.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-dvh bg-ink text-white">
        {children}
        <AppToaster />
        <PwaRegister />
      </body>
    </html>
  );
}
