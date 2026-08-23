import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeInitializationScript = `
(() => {
  try {
    const storageKey = "lakuvo-theme";
    const saved = window.localStorage.getItem(storageKey);

    const theme =
      saved === "light" ||
      saved === "dark" ||
      saved === "system"
        ? saved
        : "system";

    const systemDark =
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const resolved =
      theme === "dark" ||
      (theme === "system" && systemDark)
        ? "dark"
        : "light";

    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  } catch {
    document.documentElement.classList.add("light");
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <Script
          id="lakuvo-theme-init"
          strategy="beforeInteractive"
        >
          {themeInitializationScript}
        </Script>

        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
