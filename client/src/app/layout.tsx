import type { Metadata, Viewport } from "next";
import { Josefin_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const josefin = Josefin_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-josefin",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BeeExpress",
  description:
    "BeeExpress — yetkazib berish va marketplace platformasi. Telegram Mini App.",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="uz"
      className={`${josefin.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Telegram Mini App SDK — loaded before hydration so window.Telegram.WebApp is ready. */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-full bg-surface-2 text-ink">{children}</body>
    </html>
  );
}
