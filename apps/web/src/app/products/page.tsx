import Link from "next/link";

import DashboardLayout from "@/components/layout/DashboardLayout";
import DeleteProductButton from "@/components/products/DeleteProductButton";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";

const PAGE_SIZE = 20;

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
};

type ProductFilters = {
  q: string;
  status: string;
  category: string;
  sort: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function buildProductsUrl(filters: ProductFilters, page: number) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.sort && filters.sort !== "newest") {
    params.set("sort", filters.sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/products?${query}` : "/products";
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const locale = await getLocale();
  const productsCopy = getDictionary(locale).products;

  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{productsCopy.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {productsCopy.noOrganization}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const params = await searchParams;

  const q = String(params.q ?? "").trim();

  const status =
    params.status === "active" || params.status === "inactive"
      ? params.status
      : "";

  const category =
    typeof params.category === "string" && isUuid(params.category)
      ? params.category
      : "";

  const allowedSorts = new Set([
    "newest",
    "oldest",
    "name_asc",
    "name_desc",
    "price_asc",
    "price_desc",
    "stock_asc",
    "stock_desc",
  ]);

  const sort = allowedSorts.has(String(params.sort))
    ? String(params.sort)
    : "newest";

  const requestedPage = Number.parseInt(String(params.page ?? "1"), 10);
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const filters: ProductFilters = {
    q,
    status,
    category,
    sort,
  };

  const supabase = await createClient();

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("organization_id", currentOrganization.organizationId)
    .order("name", { ascending: true });

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  let productsQuery = supabase
    .from("products")
    .select(
      "id, name, description, sku, category_id, price, cost_price, stock, status, created_at",
      { count: "exact" },
    )
    .eq("organization_id", currentOrganization.organizationId);

  if (q) {
    const safeSearch = q.replace(/[(),]/g, " ").trim();

    if (safeSearch) {
      productsQuery = productsQuery.or(
        `name.ilike.%${safeSearch}%,sku.ilike.%${safeSearch}%`,
      );
    }
  }

  if (status) {
    productsQuery = productsQuery.eq("status", status);
  }

  if (category) {
    productsQuery = productsQuery.eq("category_id", category);
  }

  switch (sort) {
    case "oldest":
      productsQuery = productsQuery.order("created_at", {
        ascending: true,
      });
      break;

    case "name_asc":
      productsQuery = productsQuery.order("name", {
        ascending: true,
      });
      break;

    case "name_desc":
      productsQuery = productsQuery.order("name", {
        ascending: false,
      });
      break;

    case "price_asc":
      productsQuery = productsQuery.order("price", {
        ascending: true,
      });
      break;

    case "price_desc":
      productsQuery = productsQuery.order("price", {
        ascending: false,
      });
      break;

    case "stock_asc":
      productsQuery = productsQuery.order("stock", {
        ascending: true,
      });
      break;

    case "stock_desc":
      productsQuery = productsQuery.order("stock", {
        ascending: false,
      });
      break;

    default:
      productsQuery = productsQuery.order("created_at", {
        ascending: false,
      });
      break;
  }

  const {
    data: products,
    error: productsError,
    count,
  } = await productsQuery.range(from, to);

  if (productsError) {
    throw new Error(productsError.message);
  }

  const categoryNames = new Map(
    categories.map((item) => [item.id, item.name]),
  );

  const totalProducts = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{productsCopy.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {productsCopy.description}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="space-y-5 border-b px-6 py-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-semibold">
                  {productsCopy.management.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {totalProducts} {productsCopy.management.matchingProducts}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/inventory"
                  className="inline-flex h-9 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {productsCopy.management.inventoryHistory}
                </Link>

                <Link
                  href="/products/new"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  {productsCopy.management.addProduct}
                </Link>
              </div>
            </div>

            <form
              method="get"
              action="/products"
              className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_220px_190px_auto]"
            >
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder={productsCopy.filters.searchPlaceholder}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />

              <select
                name="status"
                defaultValue={status}
                className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">{productsCopy.filters.allStatuses}</option>
                <option value="active">{productsCopy.filters.active}</option>
                <option value="inactive">{productsCopy.filters.inactive}</option>
              </select>

              <select
                name="category"
                defaultValue={category}
                className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">{productsCopy.filters.allCategories}</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                name="sort"
                defaultValue={sort}
                className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="newest">{productsCopy.filters.newest}</option>
                <option value="oldest">{productsCopy.filters.oldest}</option>
                <option value="name_asc">{productsCopy.filters.nameAsc}</option>
                <option value="name_desc">{productsCopy.filters.nameDesc}</option>
                <option value="price_asc">{productsCopy.filters.priceAsc}</option>
                <option value="price_desc">{productsCopy.filters.priceDesc}</option>
                <option value="stock_asc">{productsCopy.filters.stockAsc}</option>
                <option value="stock_desc">{productsCopy.filters.stockDesc}</option>
              </select>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  {productsCopy.filters.apply}
                </button>

                <Link
                  href="/products"
                  className="inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {productsCopy.filters.reset}
                </Link>
              </div>
            </form>
          </div>

          {products.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium">{productsCopy.empty.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {productsCopy.empty.description}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left">
                    <tr>
                      <th className="px-6 py-3 font-medium">{productsCopy.table.product}</th>
                      <th className="px-6 py-3 font-medium">SKU</th>
                      <th className="px-6 py-3 font-medium">{productsCopy.table.category}</th>
                      <th className="px-6 py-3 font-medium">
                        {productsCopy.table.sellingPrice}
                      </th>
                      <th className="px-6 py-3 font-medium">
                        {productsCopy.table.costPrice}
                      </th>
                      <th className="px-6 py-3 font-medium">{productsCopy.table.stock}</th>
                      <th className="px-6 py-3 font-medium">{productsCopy.table.status}</th>
                      <th className="px-6 py-3 font-medium">{productsCopy.table.actions}</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {product.name}
                          </div>

                          {product.description ? (
                            <div className="mt-1 max-w-xs truncate text-muted-foreground">
                              {product.description}
                            </div>
                          ) : null}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          {product.sku || "\u2014"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          {product.category_id
                            ? categoryNames.get(product.category_id) ??
                              productsCopy.table.unknown
                            : productsCopy.table.uncategorized}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          {formatCurrency(Number(product.price))}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          {formatCurrency(Number(product.cost_price))}
                        </td>

                        <td className="px-6 py-4">
                          {product.stock}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                            {product.status === "active"
                              ? productsCopy.filters.active
                              : product.status === "inactive"
                                ? productsCopy.filters.inactive
                                : product.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <Link
                              href={`/products/${product.id}/edit`}
                              className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                            >
                              {productsCopy.actions.edit}
                            </Link>

                            <Link
                              href={`/products/${product.id}/variants`}
                              className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                            >
                              {productsCopy.actions.variants}
                            </Link>

                            <Link
                              href={`/products/${product.id}/suppliers`}
                              className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                            >
                              {productsCopy.actions.suppliers}
                            </Link>

                            <Link
                              href={`/products/${product.id}/performance`}
                              className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                            >
                              {productsCopy.actions.performance}
                            </Link>
                        <Link
                          href={`/products/${product.id}/description`}
                          className="inline-flex items-center text-sm font-medium hover:underline"
                        >
                          {productsCopy.actions.aiDescription}
                        </Link>
<Link
                              href={`/products/${product.id}/images`}
                              className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                            >
                              {productsCopy.actions.images}
                            </Link>

                            <Link
                              href={`/products/${product.id}/inventory/adjust`}
                              className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                            >
                              {productsCopy.actions.adjustStock}
                            </Link>

                            <DeleteProductButton
                              organizationId={
                                currentOrganization.organizationId
                              }
                              productId={product.id}
                              productName={product.name}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col justify-between gap-3 border-t px-6 py-4 text-sm sm:flex-row sm:items-center">
                <p className="text-muted-foreground">
                  {productsCopy.pagination.page} {page} {productsCopy.pagination.of} {totalPages} {" · "} {totalProducts} {productsCopy.pagination.products}
                </p>

                <div className="flex gap-2">
                  {page > 1 ? (
                    <Link
                      href={buildProductsUrl(filters, page - 1)}
                      className="inline-flex h-8 items-center justify-center rounded-lg border px-3 font-medium transition-colors hover:bg-muted"
                    >
                      {productsCopy.pagination.previous}
                    </Link>
                  ) : (
                    <span className="inline-flex h-8 cursor-not-allowed items-center justify-center rounded-lg border px-3 text-muted-foreground opacity-50">
                      {productsCopy.pagination.previous}
                    </span>
                  )}

                  {page < totalPages ? (
                    <Link
                      href={buildProductsUrl(filters, page + 1)}
                      className="inline-flex h-8 items-center justify-center rounded-lg border px-3 font-medium transition-colors hover:bg-muted"
                    >
                      {productsCopy.pagination.next}
                    </Link>
                  ) : (
                    <span className="inline-flex h-8 cursor-not-allowed items-center justify-center rounded-lg border px-3 text-muted-foreground opacity-50">
                      {productsCopy.pagination.next}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
