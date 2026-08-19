import Link from "next/link";
import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import DeleteProductVariantButton from "@/components/products/DeleteProductVariantButton";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type ProductVariantsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getIntlLocale(
  locale: Locale,
) {
  return locale === "id"
    ? "id-ID"
    : "en-US";
}

function formatCurrency(
  value: number,
  locale: Locale,
) {
  return new Intl.NumberFormat(
    getIntlLocale(locale),
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    },
  ).format(value);
}

export default async function ProductVariantsPage({
  params,
}: ProductVariantsPageProps) {
  const locale = await getLocale();
  const productsCopy =
    getDictionary(locale).products;
  const variantsCopy =
    productsCopy.variants;

  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {variantsCopy.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {productsCopy.noOrganization}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { id } = await params;
  const supabase = await createClient();

  const {
    data: product,
    error: productError,
  } = await supabase
    .from("products")
    .select("id, name, sku")
    .eq("id", id)
    .eq(
      "organization_id",
      currentOrganization.organizationId,
    )
    .maybeSingle();

  if (productError) {
    throw new Error(
      productError.message,
    );
  }

  if (!product) {
    notFound();
  }

  const {
    data: variants,
    error: variantsError,
  } = await supabase
    .from("product_variants")
    .select(
      "id, sku, name, price, cost_price, stock, status, created_at",
    )
    .eq(
      "organization_id",
      currentOrganization.organizationId,
    )
    .eq(
      "product_id",
      product.id,
    )
    .order("created_at", {
      ascending: false,
    });

  if (variantsError) {
    throw new Error(
      variantsError.message,
    );
  }

  function getStatusLabel(
    status: string,
  ) {
    switch (status) {
      case "active":
        return variantsCopy.statuses.active;

      case "inactive":
        return variantsCopy.statuses.inactive;

      default:
        return status;
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <Link
              href="/products"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {variantsCopy.backToProducts}
            </Link>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              {variantsCopy.title}
            </h1>

            <p className="mt-2 text-muted-foreground">
              {variantsCopy.descriptionPrefix}{" "}
              <span className="font-medium text-foreground">
                {product.name}
              </span>
              {product.sku
                ? ` (${product.sku})`
                : ""}
              .
            </p>
          </div>

          <Link
            href={`/products/${product.id}/variants/new`}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            {variantsCopy.addVariant}
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              {variantsCopy.management.title}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {variants.length}{" "}
              {variantsCopy.management.countSuffix}
            </p>
          </div>

          {variants.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium">
                {
                  variantsCopy.management
                    .emptyTitle
                }
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {
                  variantsCopy.management
                    .emptyDescription
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">
                      {variantsCopy.table.variant}
                    </th>

                    <th className="px-6 py-3 font-medium">
                      {variantsCopy.table.sku}
                    </th>

                    <th className="px-6 py-3 font-medium">
                      {
                        variantsCopy.table
                          .sellingPrice
                      }
                    </th>

                    <th className="px-6 py-3 font-medium">
                      {
                        variantsCopy.table
                          .costPrice
                      }
                    </th>

                    <th className="px-6 py-3 font-medium">
                      {variantsCopy.table.stock}
                    </th>

                    <th className="px-6 py-3 font-medium">
                      {variantsCopy.table.status}
                    </th>

                    <th className="px-6 py-3 font-medium">
                      {variantsCopy.table.actions}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {variants.map(
                    (variant) => (
                      <tr key={variant.id}>
                        <td className="px-6 py-4 font-medium">
                          {variant.name}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          {variant.sku}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          {formatCurrency(
                            Number(
                              variant.price,
                            ),
                            locale,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          {formatCurrency(
                            Number(
                              variant.cost_price,
                            ),
                            locale,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {variant.stock}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                            {getStatusLabel(
                              variant.status,
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <Link
                              href={`/products/${product.id}/variants/${variant.id}/edit`}
                              className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                            >
                              {
                                variantsCopy
                                  .actions.edit
                              }
                            </Link>

                            <Link
                              href={`/products/${product.id}/variants/${variant.id}/inventory/adjust`}
                              className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                            >
                              {
                                variantsCopy
                                  .actions
                                  .adjustStock
                              }
                            </Link>

                            <DeleteProductVariantButton
                              organizationId={
                                currentOrganization.organizationId
                              }
                              productId={
                                product.id
                              }
                              variantId={
                                variant.id
                              }
                              variantName={
                                variant.name
                              }
                              copy={
                                variantsCopy.delete
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
