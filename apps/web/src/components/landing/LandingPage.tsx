"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Link2,
  Package,
  Play,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import {
  LakuvoBrand,
} from "@/components/brand/LakuvoBrand";
import {
  LanguageSwitcher,
} from "@/components/i18n/LanguageSwitcher";
import {
  useLanguage,
} from "@/components/i18n/LanguageProvider";
import {
  ThemeSwitcher,
} from "@/components/theme/ThemeSwitcher";

import {
  LandingProductPreview,
} from "./LandingProductPreview";

import { LandingTodayStory } from "./LandingTodayStory";

import { LandingAiActionStory } from "./LandingAiActionStory";

import { LandingVisualShowcase } from "./LandingVisualShowcase";

export function LandingPage() {
  const {
    locale,
  } =
    useLanguage();

  const isId =
    locale === "id";

  const copy =
    isId
      ? {
          nav: {
            product: "Produk",
            solutions: "Solusi",
            workflow: "Cara Kerja",
            pricing: "Harga",
            login: "Masuk",
            signup: "Mulai Gratis 14 Hari",
          },
          hero: {
            badge:
              "COMMERCE OPERATING SYSTEM",
            title:
              "Satu pusat kendali untuk seluruh operasi commerce Anda.",
            description:
              "Kelola produk, marketplace, pesanan, pelanggan, analitik, dan automasi AI dalam satu workspace yang membantu Anda memahami apa yang terjadi—dan apa yang perlu dilakukan berikutnya.",
            primary:
              "Mulai Gratis 14 Hari",
            secondary:
              "Lihat LAKUVO Beraksi",
            free:
              "14 hari gratis",
            noCard:
              "Tanpa kartu kredit",
            cancel:
              "Batalkan kapan saja",
          },
          capabilities: {
            eyebrow:
              "SATU SISTEM, SATU KONTEKS",
            title:
              "Semua yang Anda butuhkan untuk menjalankan commerce dengan lebih terarah.",
            description:
              "Dari pekerjaan operasional sampai keputusan berbasis data, LAKUVO menjaga semuanya tetap berada dalam konteks bisnis yang sama.",
          },
          workflow: {
            eyebrow:
              "CARA KERJA",
            title:
              "Dari data commerce menjadi tindakan yang lebih jelas.",
            description:
              "Hubungkan operasi, jalankan pekerjaan harian, pahami data, lalu gunakan AI untuk membantu langkah berikutnya.",
          },
          pricing: {
            eyebrow:
              "HARGA",
            title:
              "Pilih paket yang sesuai dengan tahap bisnis Anda.",
            description:
              "Mulai 14 hari gratis tanpa kartu kredit. Paket tahunan: bayar 10 bulan dan gunakan 12 bulan.",
            monthly:
              "/bulan",
            popular:
              "Paling Populer",
            stores:
              "Store",
            users:
              "User",
            credits:
              "AI Credits",
            start:
              "Mulai Gratis",
            interest:
              "Daftar Minat",
          },
          trust: {
            title:
              "AI yang membantu tanpa mengambil alih kontrol bisnis Anda.",
            description:
              "LAKUVO dirancang untuk menggunakan data terverifikasi, memisahkan rekomendasi dari eksekusi, dan menjaga tindakan penting tetap berada dalam kontrol Anda.",
          },
          final: {
            title:
              "Siap mengendalikan bisnis commerce Anda dengan lebih cerdas?",
            description:
              "Mulai gratis hari ini. Tanpa risiko. Tanpa kartu kredit.",
            cta:
              "Mulai Gratis 14 Hari Sekarang",
          },
          footer:
            "Commerce operations, intelligence, and controlled AI in one workspace.",
        }
      : {
          nav: {
            product: "Product",
            solutions: "Solutions",
            workflow: "How It Works",
            pricing: "Pricing",
            login: "Sign In",
            signup: "Start Free for 14 Days",
          },
          hero: {
            badge:
              "COMMERCE OPERATING SYSTEM",
            title:
              "One command center for your entire commerce operation.",
            description:
              "Manage products, marketplaces, orders, customers, analytics, and AI automation in one workspace that helps you understand what is happening—and what to do next.",
            primary:
              "Start Free for 14 Days",
            secondary:
              "See LAKUVO in Action",
            free:
              "14-day free trial",
            noCard:
              "No credit card",
            cancel:
              "Cancel anytime",
          },
          capabilities: {
            eyebrow:
              "ONE SYSTEM, ONE CONTEXT",
            title:
              "Everything you need to run commerce with more clarity.",
            description:
              "From daily operations to data-driven decisions, LAKUVO keeps the business context connected in one workspace.",
          },
          workflow: {
            eyebrow:
              "HOW IT WORKS",
            title:
              "Turn commerce data into clearer action.",
            description:
              "Connect your operations, run the daily work, understand the data, then use AI to support the next move.",
          },
          pricing: {
            eyebrow:
              "PRICING",
            title:
              "Choose the plan that matches your stage of growth.",
            description:
              "Start with a 14-day free trial and no credit card. Annual plans: pay for 10 months and use 12.",
            monthly:
              "/month",
            popular:
              "Most Popular",
            stores:
              "Stores",
            users:
              "Users",
            credits:
              "AI Credits",
            start:
              "Start Free",
            interest:
              "Register Interest",
          },
          trust: {
            title:
              "AI that assists without taking control away from your business.",
            description:
              "LAKUVO is designed around verified data, separation between recommendations and execution, and keeping important actions under your control.",
          },
          final: {
            title:
              "Ready to run your commerce operation with more clarity?",
            description:
              "Start today. No risk. No credit card required.",
            cta:
              "Start Your Free 14 Days",
          },
          footer:
            "Commerce operations, intelligence, and controlled AI in one workspace.",
        };

  const capabilities =
    isId
      ? [
          {
            title:
              "Operasional Lengkap",
            description:
              "Produk, marketplace, riset produk, pesanan, pelanggan, dan pemasok dalam satu alur kerja.",
            icon:
              Package,
          },
          {
            title:
              "AI & Otomasi",
            description:
              "Asisten AI, Agen AI, dan Action Center membantu pekerjaan lebih cepat dan tetap terkontrol.",
            icon:
              Bot,
          },
          {
            title:
              "Analitik & Wawasan",
            description:
              "Ringkasan performa dan wawasan berbasis data membantu keputusan yang lebih baik.",
            icon:
              BarChart3,
          },
          {
            title:
              "Aman & Terpercaya",
            description:
              "Rekomendasi, konfirmasi, dan eksekusi tetap dipisahkan untuk tindakan penting.",
            icon:
              ShieldCheck,
          },
        ]
      : [
          {
            title:
              "Complete Operations",
            description:
              "Products, marketplaces, research, orders, customers, and suppliers in one operating flow.",
            icon:
              Package,
          },
          {
            title:
              "AI & Automation",
            description:
              "AI Assistant, AI Agents, and Action Center help work move faster while staying controlled.",
            icon:
              Bot,
          },
          {
            title:
              "Analytics & Intelligence",
            description:
              "Performance summaries and data-driven insights support better business decisions.",
            icon:
              BarChart3,
          },
          {
            title:
              "Safe & Controlled",
            description:
              "Recommendations, confirmation, and execution remain separated for important actions.",
            icon:
              ShieldCheck,
          },
        ];

  const workflow =
    isId
      ? [
          [
            "Connect",
            "Hubungkan toko, marketplace, dan kanal penjualan Anda.",
            Link2,
          ],
          [
            "Operate",
            "Kelola operasi harian dengan workflow yang terstruktur.",
            Package,
          ],
          [
            "Understand",
            "Pahami performa dari data commerce yang terverifikasi.",
            BarChart3,
          ],
          [
            "Automate",
            "Gunakan AI untuk rekomendasi dan automasi terkontrol.",
            Zap,
          ],
        ]
      : [
          [
            "Connect",
            "Connect stores, marketplaces, and sales channels.",
            Link2,
          ],
          [
            "Operate",
            "Run daily operations through structured workflows.",
            Package,
          ],
          [
            "Understand",
            "Understand performance from verified commerce data.",
            BarChart3,
          ],
          [
            "Automate",
            "Use AI for recommendations and controlled automation.",
            Zap,
          ],
        ];

  const plans =
    [
      {
        name:
          "Starter",
        price:
          "Rp199.000",
        stores:
          "2",
        users:
          "2",
        credits:
          "100",
        popular:
          false,
        enterprise:
          false,
      },
      {
        name:
          "Growth",
        price:
          "Rp499.000",
        stores:
          "5",
        users:
          "5",
        credits:
          "500",
        popular:
          true,
        enterprise:
          false,
      },
      {
        name:
          "Scale",
        price:
          "Rp999.000",
        stores:
          "15",
        users:
          "15",
        credits:
          "2.000",
        popular:
          false,
        enterprise:
          false,
      },
      {
        name:
          "Enterprise",
        price:
          "Custom",
        stores:
          "Custom",
        users:
          "Custom",
        credits:
          "Custom",
        popular:
          false,
        enterprise:
          true,
      },
    ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link
            href="/"
            aria-label="LAKUVO"
          >
            <LakuvoBrand />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
            <a
              href="#product"
              className="transition-colors hover:text-foreground"
            >
              {copy.nav.product}
            </a>

            <a
              href="#solutions"
              className="transition-colors hover:text-foreground"
            >
              {copy.nav.solutions}
            </a>

            <a
              href="#workflow"
              className="transition-colors hover:text-foreground"
            >
              {copy.nav.workflow}
            </a>

            <a
              href="#pricing"
              className="transition-colors hover:text-foreground"
            >
              {copy.nav.pricing}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>

            <div className="hidden sm:block">
              <ThemeSwitcher />
            </div>

            <Link
              href="/login"
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted md:inline-flex"
            >
              {copy.nav.login}
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 sm:text-sm"
            >
              {copy.nav.signup}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section
          id="product"
          className="relative"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_35%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_38%)]" />

          <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 py-12 sm:px-8 sm:py-14 lg:grid-cols-[0.80fr_1.20fr] lg:gap-10 lg:px-12 lg:py-16 xl:py-18">
            <div className="max-w-[590px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {copy.hero.badge}
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl lg:text-[58px] lg:leading-[1.03] xl:text-[62px]">
                {copy.hero.title}
              </h1>

              <p className="mt-5 max-w-[560px] text-base leading-7 text-muted-foreground sm:text-lg">
                {copy.hero.description}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:opacity-95"
                >
                  {copy.hero.primary}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#today-story"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border bg-card px-6 text-sm font-semibold shadow-sm transition hover:bg-muted"
                >
                  <Play className="h-4 w-4" />
                  {copy.hero.secondary}
                </a>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
                {[
                  copy.hero.free,
                  copy.hero.noCard,
                  copy.hero.cancel,
                ].map(
                  (item) => (
                    <span
                      key={item}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-3.5 w-3.5 text-primary" />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <LandingProductPreview
              locale={locale}
            />
          </div>
        </section>

        <section
          id="solutions"
          className="border-y border-border/60 bg-muted/25"
        >
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-[0.18em] text-primary">
                {copy.capabilities.eyebrow}
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {copy.capabilities.title}
              </h2>

              <p className="mt-4 leading-7 text-muted-foreground">
                {copy.capabilities.description}
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {capabilities.map(
                ({
                  title,
                  description,
                  icon: Icon,
                }) => (
                  <article
                    key={title}
                    className="rounded-2xl border bg-card p-6 shadow-sm"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>

                    <h3 className="mt-5 font-semibold">
                      {title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {description}
                    </p>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        <LandingVisualShowcase
          locale={locale}
        />

        <LandingTodayStory
          locale={locale}
        />

        <section
          id="workflow"
          className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12"
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold tracking-[0.18em] text-primary">
              {copy.workflow.eyebrow}
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {copy.workflow.title}
            </h2>

            <p className="mt-4 leading-7 text-muted-foreground">
              {copy.workflow.description}
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map(
              (
                [
                  title,
                  description,
                  Icon,
                ],
                index,
              ) => (
                <div
                  key={title as string}
                  className="relative rounded-2xl border bg-card p-6"
                >
                  <span className="absolute right-5 top-5 text-5xl font-black text-primary/[0.06]">
                    {index + 1}
                  </span>

                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>

                  <h3 className="mt-5 font-semibold">
                    {title as string}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description as string}
                  </p>
                </div>
              ),
            )}
          </div>
        </section>

        <LandingAiActionStory
          locale={locale}
        />

        <section
          id="pricing"
          className="border-y border-border/60 bg-muted/25"
        >
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-[0.18em] text-primary">
                {copy.pricing.eyebrow}
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {copy.pricing.title}
              </h2>

              <p className="mt-4 leading-7 text-muted-foreground">
                {copy.pricing.description}
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {plans.map(
                (plan) => (
                  <article
                    key={plan.name}
                    className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm ${
                      plan.popular
                        ? "border-primary ring-1 ring-primary/20"
                        : ""
                    }`}
                  >
                    {plan.popular ? (
                      <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
                        {copy.pricing.popular}
                      </span>
                    ) : null}

                    <h3 className="text-lg font-semibold">
                      {plan.name}
                    </h3>

                    <div className="mt-4 flex items-end gap-1">
                      <span className="text-3xl font-bold tracking-tight">
                        {plan.price}
                      </span>

                      {!plan.enterprise ? (
                        <span className="pb-1 text-xs text-muted-foreground">
                          {copy.pricing.monthly}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-6 flex-1 space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        {plan.stores} {copy.pricing.stores}
                      </div>

                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        {plan.users} {copy.pricing.users}
                      </div>

                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        {plan.credits} {copy.pricing.credits}
                      </div>
                    </div>

                    <Link
                      href="/signup"
                      className={`mt-7 inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition ${
                        plan.popular
                          ? "bg-primary text-primary-foreground hover:opacity-90"
                          : "border bg-background hover:bg-muted"
                      }`}
                    >
                      {
                        plan.enterprise
                          ? copy.pricing.interest
                          : copy.pricing.start
                      }
                    </Link>
                  </article>
                ),
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary" />
                {copy.hero.free}
              </span>

              <span className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary" />
                {copy.hero.noCard}
              </span>

              <span className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary" />
                {
                  isId
                    ? "Bayar 10 bulan, dapat 12 bulan"
                    : "Pay for 10 months, use 12"
                }
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12">
          <div className="relative overflow-hidden rounded-[28px] border bg-card p-8 shadow-sm sm:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative max-w-3xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </span>

              <h2 className="mt-6 text-3xl font-bold tracking-tight">
                {copy.trust.title}
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
                {copy.trust.description}
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 pb-10 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-6 rounded-[28px] bg-primary/10 px-6 py-10 text-center md:flex-row md:px-10 md:text-left">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {copy.final.title}
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {copy.final.description}
              </p>
            </div>

            <Link
              href="/signup"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              {copy.final.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div>
            <LakuvoBrand />

            <p className="mt-3 max-w-sm text-xs leading-5 text-muted-foreground">
              {copy.footer}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <a
              href="#product"
              className="hover:text-foreground"
            >
              {copy.nav.product}
            </a>

            <a
              href="#solutions"
              className="hover:text-foreground"
            >
              {copy.nav.solutions}
            </a>

            <a
              href="#pricing"
              className="hover:text-foreground"
            >
              {copy.nav.pricing}
            </a>

            <Link
              href="/login"
              className="hover:text-foreground"
            >
              {copy.nav.login}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
