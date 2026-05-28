import type { Metadata, Viewport } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";

const josefin = Josefin_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-josefin",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BeeExpress Courier",
  description: "BeeExpress kuryer paneli",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${josefin.variable} h-full antialiased`}>
      <body className="min-h-full bg-surface-2 text-ink">{children}</body>
    </html>
  );
}
