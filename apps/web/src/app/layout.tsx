import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lakuvo.com"),
  applicationName: "LAKUVO",
  title: {
    default: "LAKUVO",
    template: "%s | LAKUVO",
  },
  description:
    "Platform operasi commerce berbasis AI untuk mengelola produk, pesanan, inventori, analitik, automasi, dan intelligence bisnis.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "LAKUVO",
    title: "LAKUVO",
    description:
      "Platform operasi commerce berbasis AI untuk mengelola produk, pesanan, inventori, analitik, automasi, dan intelligence bisnis.",
  },
  twitter: {
    card: "summary",
    title: "LAKUVO",
    description:
      "Platform operasi commerce berbasis AI untuk mengelola produk, pesanan, inventori, analitik, automasi, dan intelligence bisnis.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
