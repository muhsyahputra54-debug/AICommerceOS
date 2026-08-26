import type {
  Metadata,
} from "next";
import Link from "next/link";

import {
  PublicSiteShell,
} from "@/components/marketing/PublicSiteShell";

export const metadata: Metadata = {
  title: "Harga",
  description:
    "Harga paket LAKUVO dalam Rupiah untuk Free, Starter, dan Pro.",
  alternates: {
    canonical: "/pricing",
  },
};

const plans = [
  {
    name: "Free",
    monthly: "Rp0",
    annual: "Rp0",
    description:
      "Untuk seller yang ingin mulai mengenal workflow LAKUVO.",
    action: "Mulai gratis",
  },
  {
    name: "Starter",
    monthly:
      "Rp199.000 / bulan",
    annual:
      "Rp1.990.000 / tahun",
    description:
      "Untuk UMKM dan seller yang mulai mengelola operasi commerce secara terstruktur.",
    action: "Daftar Starter",
  },
  {
    name: "Pro",
    monthly:
      "Rp499.000 / bulan",
    annual:
      "Rp4.990.000 / tahun",
    description:
      "Untuk seller dan brand yang membutuhkan kapasitas commerce, AI, dan automation lebih besar.",
    action: "Daftar Pro",
  },
];

export default function PricingPage() {
  return (
    <PublicSiteShell
      eyebrow="Harga LAKUVO"
      title="Paket yang jelas dalam Rupiah."
      description="LAKUVO adalah layanan Software-as-a-Service untuk operasi commerce. Pilih kapasitas yang sesuai dengan tahap bisnis Anda."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map(
          (plan) => (
            <article
              key={plan.name}
              className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div>
                <h2 className="text-2xl font-semibold">
                  {plan.name}
                </h2>

                <p className="mt-3 min-h-20 text-sm leading-6 text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div className="mt-6 space-y-2 border-y py-5">
                <p className="text-xl font-semibold">
                  {plan.monthly}
                </p>

                <p className="text-sm text-muted-foreground">
                  {plan.annual}
                </p>
              </div>

              <ul className="mt-6 flex-1 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>
                  Pengelolaan operasi commerce
                </li>
                <li>
                  Product research dan price monitoring
                </li>
                <li>
                  Automation dan analytics
                </li>
                <li>
                  Kapabilitas AI sesuai paket
                </li>
              </ul>

              <Link
                href="/signup"
                className="mt-7 inline-flex justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {plan.action}
              </Link>
            </article>
          ),
        )}
      </div>

      <div className="mt-10 rounded-2xl border bg-muted/40 p-6 text-sm leading-7 text-muted-foreground">
        <p>
          Harga ditampilkan dalam Rupiah
          Indonesia (IDR). Paket berbayar
          memberikan akses untuk periode
          yang dipilih. Pembelian periode
          berikutnya dilakukan melalui
          checkout resmi LAKUVO.
        </p>

        <p className="mt-3">
          Pertanyaan mengenai paket atau
          pembayaran dapat dikirim ke{" "}
          <a
            href="mailto:support@lakuvo.com"
            className="font-medium text-foreground underline underline-offset-4"
          >
            support@lakuvo.com
          </a>
          .
        </p>
      </div>
    </PublicSiteShell>
  );
}
