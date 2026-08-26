import Link from "next/link";
import {
  redirect,
} from "next/navigation";

import {
  getCurrentOrganization,
} from "@/lib/supabase/current-organization";

export default async function GuidedStartCompletePage() {
  const currentOrganization =
    await getCurrentOrganization();

  if (
    !currentOrganization
  ) {
    redirect(
      "/onboarding",
    );
  }

  const organizationName =
    currentOrganization.organization?.name ??
    "workspace Anda";

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            LAKUVO Guided Start
          </p>

          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Langkah 5 dari 5
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Workspace Anda siap digunakan
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Fondasi awal untuk {organizationName} sudah siap. Selanjutnya TODAY akan membantu menunjukkan apa yang perlu Anda perhatikan dan kerjakan berikutnya.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-sm font-semibold">
                Bisnis
              </p>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Business Profile memberi konteks agar AI memahami usaha Anda.
              </p>
            </div>

            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-sm font-semibold">
                Operasional
              </p>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Produk, harga, dan stok menjadi fondasi operasional pertama.
              </p>
            </div>

            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-sm font-semibold">
                Pertumbuhan
              </p>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Kanal penjualan dan AI dapat membantu Anda menentukan langkah berikutnya.
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-sm font-semibold">
              Berikutnya: TODAY
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Mulai dari langkah kecil. Anda tidak perlu menggunakan seluruh fitur LAKUVO sekaligus.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <Link
              href="/get-started/marketing"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Kembali
            </Link>

            <Link
              href="/today"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Buka TODAY
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}