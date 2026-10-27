import type { Metadata } from "next";

import {
  PublicSiteShell,
} from "@/components/marketing/PublicSiteShell";

export const metadata: Metadata = {
  title: "Tentang LAKUVO",
  description:
    "Informasi tentang LAKUVO dan identitas legal operator LAKUVO di Indonesia.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <PublicSiteShell
      eyebrow="Tentang LAKUVO"
      title="LAKUVO"
      description="Platform software e-commerce untuk membantu bisnis Indonesia mengelola operasi commerce lintas kanal."
    >
      <div className="max-w-3xl space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            Company information
          </h2>

          <p className="leading-7 text-muted-foreground">
            LAKUVO is an e-commerce software platform
            operated by HERY PANCAWIRA, a registered
            business in Indonesia.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            Legal identity
          </h2>

          <div className="leading-7 text-muted-foreground">
            <p>
              Legal operator: HERY PANCAWIRA
            </p>
            <p>
              NIB: 2510260079145
            </p>
            <p>
              Business scope: KBLI 62191 – Aktivitas
              Pengembangan Aplikasi Perdagangan melalui
              Internet (E-Commerce)
            </p>
          </div>
        </section>
      </div>
    </PublicSiteShell>
  );
}