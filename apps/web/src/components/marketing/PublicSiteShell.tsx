import Link from "next/link";
import type {
  ReactNode,
} from "react";

const navigation = [
  {
    href: "/",
    label: "Beranda",
  },
  {
    href: "/pricing",
    label: "Harga",
  },
  {
    href: "/contact",
    label: "Kontak",
  },
];

const legalNavigation = [
  {
    href: "/terms",
    label: "Syarat & Ketentuan",
  },
  {
    href: "/privacy",
    label: "Kebijakan Privasi",
  },
  {
    href: "/refund-policy",
    label: "Refund & Pembatalan",
  },
];

export function PublicSiteHeader() {
  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight"
        >
          LAKUVO
        </Link>

        <nav
          aria-label="Navigasi publik"
          className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm"
        >
          {navigation.map(
            (item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ),
          )}

          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Masuk
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicSiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Link
            href="/"
            className="text-lg font-semibold"
          >
            LAKUVO
          </Link>

          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Platform Software-as-a-Service
            untuk membantu bisnis mengelola
            operasi commerce, produk,
            pesanan, inventori, analitik,
            automasi, dan kapabilitas AI.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold">
            Informasi
          </p>

          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground"
            >
              Harga
            </Link>

            <Link
              href="/contact"
              className="text-muted-foreground hover:text-foreground"
            >
              Kontak
            </Link>

            <a
              href="mailto:support@lakuvo.com"
              className="text-muted-foreground hover:text-foreground"
            >
              support@lakuvo.com
            </a>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">
            Legal
          </p>

          <div className="mt-3 flex flex-col gap-2 text-sm">
            {legalNavigation.map(
              (item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-muted-foreground">
          © 2026 LAKUVO. Jasa Teknologi
          Informasi / Software-as-a-Service.
        </div>
      </div>
    </footer>
  );
}

export function PublicSiteShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicSiteHeader />

      <main>
        <section className="border-b bg-card">
          <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
            {eyebrow ? (
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                {eyebrow}
              </p>
            ) : null}

            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">
              {title}
            </h1>

            {description ? (
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                {description}
              </p>
            ) : null}
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          {children}
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  );
}

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">
        {title}
      </h2>

      <div className="space-y-3 text-sm leading-7 text-muted-foreground md:text-base">
        {children}
      </div>
    </section>
  );
}
