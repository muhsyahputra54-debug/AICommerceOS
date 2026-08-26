import type {
  Metadata,
} from "next";

import {
  LandingPage,
} from "@/components/landing/LandingPage";
import {
  PublicSiteFooter,
} from "@/components/marketing/PublicSiteShell";

export const metadata: Metadata = {
  title:
    "LAKUVO — Platform Operasi Commerce Berbasis AI",
  description:
    "LAKUVO membantu bisnis mengelola produk, pesanan, inventori, marketplace, analitik, automasi, dan operasional commerce berbasis AI dalam satu platform.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://lakuvo.com/",
    siteName: "LAKUVO",
    title:
      "LAKUVO — Platform Operasi Commerce Berbasis AI",
    description:
      "LAKUVO membantu bisnis mengelola produk, pesanan, inventori, marketplace, analitik, automasi, dan operasional commerce berbasis AI dalam satu platform.",
  },
  twitter: {
    card: "summary",
    title:
      "LAKUVO — Platform Operasi Commerce Berbasis AI",
    description:
      "LAKUVO membantu bisnis mengelola produk, pesanan, inventori, marketplace, analitik, automasi, dan operasional commerce berbasis AI dalam satu platform.",
  },
};

export default function Home() {
  return (
    <>
      <LandingPage />
      <PublicSiteFooter />
    </>
  );
}