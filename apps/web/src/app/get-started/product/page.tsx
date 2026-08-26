import {
  redirect,
} from "next/navigation";

import AddProductForm from "@/components/products/AddProductForm";

import {
  getDictionary,
} from "@/lib/i18n/dictionaries";

import {
  getLocale,
} from "@/lib/i18n/server";

import {
  getCurrentOrganization,
} from "@/lib/supabase/current-organization";

import {
  createClient,
} from "@/lib/supabase/server";

export default async function GuidedStartProductPage() {
  const locale =
    await getLocale();

  const productsCopy =
    getDictionary(
      locale,
    ).products;

  const currentOrganization =
    await getCurrentOrganization();

  if (
    !currentOrganization
  ) {
    redirect(
      "/onboarding",
    );
  }

  const supabase =
    await createClient();

  const {
    data: categories,
    error,
  } =
    await supabase
      .from(
        "categories",
      )
      .select(
        "id, name",
      )
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .order(
        "name",
        {
          ascending:
            true,
        },
      );

  if (
    error
  ) {
    throw new Error(
      error.message,
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            LAKUVO Guided Start
          </p>

          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Langkah 2 dari 5
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Buat produk pertama Anda
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Mulai dari satu produk yang paling siap Anda jual. Anda dapat menambahkan produk lain setelah Guided Start selesai.
          </p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-sm font-medium">
              Produk
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Gunakan nama yang mudah dikenali calon pembeli.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-sm font-medium">
              Harga
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Isi harga modal dan harga jual agar LAKUVO dapat membantu Anda memahami margin.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-sm font-medium">
              Stok awal
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Masukkan jumlah stok yang benar-benar siap dijual.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
          <AddProductForm
            organizationId={
              currentOrganization.organizationId
            }
            categories={
              categories ??
              []
            }
            copy={
              productsCopy.workflow
            }
            successPath="/get-started/channels"
            cancelPath="/get-started/business"
          />
        </div>
      </div>
    </main>
  );
}