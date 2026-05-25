import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";

const josefin = Josefin_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-josefin",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BeeExpress — Sotuvchi paneli",
  description: "BeeExpress sotuvchi paneli — mahsulot, buyurtma va moliya boshqaruvi.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${josefin.variable} h-full antialiased`}>
      <body className="min-h-full bg-surface-2 text-ink">{children}</body>
    </html>
  );
}
