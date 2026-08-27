import type {
  Metadata,
} from "next";
import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import {
  blogArticles,
  getBlogArticle,
} from "@/lib/blog/articles";

type BlogArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogArticles.map(
    (article) => ({
      slug:
        article.slug,
    }),
  );
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const {
    slug,
  } =
    await params;

  const article =
    getBlogArticle(
      slug,
    );

  if (!article) {
    return {};
  }

  return {
    title:
      `${article.title} | LAKUVO`,
    description:
      article.description,
    alternates: {
      canonical:
        `https://lakuvo.com/blog/${article.slug}`,
    },
    openGraph: {
      type:
        "article",
      title:
        article.title,
      description:
        article.description,
      url:
        `https://lakuvo.com/blog/${article.slug}`,
      publishedTime:
        article.publishedAt,
      modifiedTime:
        article.updatedAt,
    },
  };
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "numeric",
      month:
        "long",
      year:
        "numeric",
      timeZone:
        "UTC",
    },
  ).format(
    new Date(
      `${value}T00:00:00Z`,
    ),
  );
}

export default async function BlogArticlePage({
  params,
}: BlogArticlePageProps) {
  const {
    slug,
  } =
    await params;

  const article =
    getBlogArticle(
      slug,
    );

  if (!article) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <article>
        <header className="border-b bg-muted/30">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <Link
              href="/blog"
              className="text-sm font-medium text-primary"
            >
              ← LAKUVO Learn
            </Link>

            <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                {article.category}
              </span>

              <span>
                {article.readingMinutes} menit baca
              </span>

              <span>
                {formatDate(
                  article.publishedAt,
                )}
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              {article.title}
            </h1>

            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              {article.description}
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="space-y-10">
            {article.sections.map(
              (section) => (
                <section
                  key={section.heading}
                >
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {section.heading}
                  </h2>

                  <div className="mt-4 space-y-4">
                    {section.paragraphs.map(
                      (paragraph) => (
                        <p
                          key={paragraph}
                          className="text-base leading-8 text-muted-foreground"
                        >
                          {paragraph}
                        </p>
                      ),
                    )}
                  </div>

                  {section.bullets ? (
                    <ul className="mt-5 space-y-3">
                      {section.bullets.map(
                        (bullet) => (
                          <li
                            key={bullet}
                            className="flex gap-3 text-base leading-7 text-muted-foreground"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                            />

                            <span>
                              {bullet}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : null}
                </section>
              ),
            )}
          </div>

          <aside className="mt-14 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
            <p className="text-sm font-semibold text-primary">
              Mulai sederhana, tumbuh tanpa pindah sistem
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Terapkan langkah berikutnya bersama LAKUVO
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Guided Start membantu menyiapkan profil bisnis, produk, harga, stok, kanal penjualan, dan rencana pemasaran awal sebelum Anda masuk ke TODAY.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Mulai gratis
              </Link>

              <Link
                href="/blog"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-5 text-sm font-medium transition-colors hover:bg-accent"
              >
                Artikel lainnya
              </Link>
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}