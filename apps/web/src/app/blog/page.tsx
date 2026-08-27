import type {
  Metadata,
} from "next";
import Link from "next/link";

import {
  blogArticles,
} from "@/lib/blog/articles";

export const metadata: Metadata = {
  title:
    "Blog & Learn LAKUVO — Panduan Usaha Online untuk UMKM",
  description:
    "Panduan praktis tentang memulai usaha online, produk, stok, harga, marketing, marketplace, penjualan, dan AI untuk UMKM.",
  alternates: {
    canonical:
      "https://lakuvo.com/blog",
  },
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold text-primary">
            LAKUVO Learn
          </p>

          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Belajar membangun usaha yang lebih rapi
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Panduan praktis untuk memulai, menjalankan, dan mengembangkan usaha online — dari produk pertama sampai penggunaan AI.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Mulai dengan LAKUVO
            </Link>

            <Link
              href="/pricing"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-5 text-sm font-medium transition-colors hover:bg-accent"
            >
              Lihat Paket
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            Panduan terbaru
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Mulai dari topik yang paling dekat dengan tahap bisnis Anda sekarang.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {blogArticles.map(
            (article) => (
              <article
                key={article.slug}
                className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                    {article.category}
                  </span>

                  <span className="text-muted-foreground">
                    {article.readingMinutes} menit baca
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-semibold tracking-tight">
                  <Link
                    href={`/blog/${article.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {article.title}
                  </Link>
                </h3>

                <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                  {article.description}
                </p>

                <Link
                  href={`/blog/${article.slug}`}
                  className="mt-5 text-sm font-semibold text-primary"
                >
                  Baca panduan →
                </Link>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Dari belajar menjadi tindakan
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              LAKUVO membantu Anda menerapkan fondasi usaha melalui Guided Start, TODAY, pengelolaan produk dan stok, serta bantuan AI.
            </p>

            <Link
              href="/signup"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Mulai gratis
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}