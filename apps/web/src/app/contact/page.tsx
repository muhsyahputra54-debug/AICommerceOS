import type {
  Metadata,
} from "next";

import {
  PublicSiteShell,
} from "@/components/marketing/PublicSiteShell";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Informasi kontak dan identitas layanan LAKUVO.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <PublicSiteShell
      eyebrow="Kontak"
      title="Hubungi LAKUVO"
      description="Untuk pertanyaan produk, paket, pembayaran, akun, atau dukungan penggunaan LAKUVO."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">
            Informasi bisnis
          </h2>

          <dl className="mt-6 space-y-5 text-sm">
            <div>
              <dt className="text-muted-foreground">
                Nama bisnis / layanan
              </dt>
              <dd className="mt-1 font-medium">
                LAKUVO
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground">
                Jenis usaha
              </dt>
              <dd className="mt-1 font-medium">
                Jasa Teknologi Informasi /
                Software-as-a-Service (SaaS)
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground">
                Website
              </dt>
              <dd className="mt-1">
                <a
                  href="https://lakuvo.com"
                  className="font-medium underline underline-offset-4"
                >
                  https://lakuvo.com
                </a>
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1">
                <a
                  href="mailto:support@lakuvo.com"
                  className="font-medium underline underline-offset-4"
                >
                  support@lakuvo.com
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">
            Dukungan
          </h2>

          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Hubungi kami melalui email untuk
            bantuan terkait akun, fitur
            LAKUVO, paket, pembayaran,
            refund, atau masalah teknis.
          </p>

          <a
            href="mailto:support@lakuvo.com"
            className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Email support@lakuvo.com
          </a>

          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            Untuk keamanan, jangan kirim
            password, OTP, PIN, CVV, atau
            kredensial pembayaran sensitif
            melalui email.
          </p>
        </section>
      </div>
    </PublicSiteShell>
  );
}
