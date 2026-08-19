"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";

type Customer = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

type ProductVariant = {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
};

type OrderItemInput = {
  productId: string;
  variantId: string;
  quantity: number;
};

type AddOrderFormProps = {
  organizationId: string;
  customers: Customer[];
  products: Product[];
  variants: ProductVariant[];
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AddOrderForm({
  organizationId,
  customers,
  products,
  variants,
}: AddOrderFormProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy =
    getDictionary(locale).orders.newOrder.form;
  const localeTag =
    locale === "id" ? "id-ID" : "en-US";

  const money = (value: number) =>
    formatCurrency(value, localeTag);

  const [customerId, setCustomerId] = useState("");

  const [items, setItems] = useState<OrderItemInput[]>([
    {
      productId: "",
      variantId: "",
      quantity: 1,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const estimatedTotal = useMemo(() => {
    return items.reduce((total, item) => {
      if (!item.productId) {
        return total;
      }

      if (item.variantId) {
        const variant = variants.find(
          (candidate) =>
            candidate.id === item.variantId &&
            candidate.product_id === item.productId,
        );

        if (!variant) {
          return total;
        }

        return (
          total +
          Number(variant.price) * item.quantity
        );
      }

      const product = products.find(
        (candidate) =>
          candidate.id === item.productId,
      );

      if (!product) {
        return total;
      }

      return (
        total +
        Number(product.price) * item.quantity
      );
    }, 0);
  }, [items, products, variants]);

  function updateItem(
    index: number,
    changes: Partial<OrderItemInput>,
  ) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...changes,
            }
          : item,
      ),
    );
  }

  function changeProduct(
    index: number,
    productId: string,
  ) {
    updateItem(index, {
      productId,
      variantId: "",
    });
  }

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      {
        productId: "",
        variantId: "",
        quantity: 1,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((currentItems) => {
      if (currentItems.length === 1) {
        return currentItems;
      }

      return currentItems.filter(
        (_, itemIndex) => itemIndex !== index,
      );
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage(null);

    if (!customerId) {
      setErrorMessage(
        copy.validation.customerRequired,
      );
      return;
    }

    if (
      items.length === 0 ||
      items.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0,
      )
    ) {
      setErrorMessage(
        copy.validation.itemInvalid,
      );
      return;
    }

    const invalidVariant = items.some((item) => {
      if (!item.variantId) {
        return false;
      }

      return !variants.some(
        (variant) =>
          variant.id === item.variantId &&
          variant.product_id === item.productId,
      );
    });

    if (invalidVariant) {
      setErrorMessage(
        copy.validation.variantMismatch,
      );
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "create_order",
      {
        p_organization_id: organizationId,
        p_customer_id: customerId,
        p_items: items.map((item) => ({
          product_id: item.productId,
          ...(item.variantId
            ? {
                variant_id: item.variantId,
              }
            : {}),
          quantity: item.quantity,
        })),
      },
    );

    if (error) {
      setErrorMessage(copy.errors.createFailed);
      setIsSubmitting(false);
      return;
    }

    router.push("/orders");
    router.refresh();
  }

  const cannotCreateOrder =
    customers.length === 0 ||
    products.length === 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm"
    >
      {cannotCreateOrder ? (
        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          {customers.length === 0
            ? copy.notices.customerRequired
            : copy.notices.productRequired}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="customer"
          className="text-sm font-medium"
        >
          {copy.customerLabel}
        </label>

        <select
          id="customer"
          value={customerId}
          onChange={(event) =>
            setCustomerId(event.target.value)
          }
          disabled={
            cannotCreateOrder ||
            isSubmitting
          }
          className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">
            {copy.selectCustomer}
          </option>

          {customers.map((customer) => (
            <option
              key={customer.id}
              value={customer.id}
            >
              {customer.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-medium">
              {copy.itemsTitle}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {copy.itemsDescription}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            disabled={
              cannotCreateOrder ||
              isSubmitting
            }
          >
            {copy.addItem}
          </Button>
        </div>

        {items.map((item, index) => {
          const productVariants =
            variants.filter(
              (variant) =>
                variant.product_id ===
                item.productId,
            );

          const selectedProduct =
            products.find(
              (product) =>
                product.id === item.productId,
            );

          return (
            <div
              key={index}
              className="grid gap-3 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_120px_auto]"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {copy.productLabel}
                </label>

                <select
                  value={item.productId}
                  onChange={(event) =>
                    changeProduct(
                      index,
                      event.target.value,
                    )
                  }
                  disabled={
                    cannotCreateOrder ||
                    isSubmitting
                  }
                  className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="">
                    {copy.selectProduct}
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                      {" — "}
                      {money(
                        Number(product.price),
                      )}
                      {" \u2014 "}{copy.stockLabel}{" "}
                      {product.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {copy.variantLabel}
                </label>

                <select
                  value={item.variantId}
                  onChange={(event) =>
                    updateItem(index, {
                      variantId:
                        event.target.value,
                    })
                  }
                  disabled={
                    !item.productId ||
                    productVariants.length === 0 ||
                    isSubmitting
                  }
                  className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="">
                    {productVariants.length > 0
                      ? copy.baseProduct
                      : copy.noVariant}
                  </option>

                  {productVariants.map(
                    (variant) => (
                      <option
                        key={variant.id}
                        value={variant.id}
                      >
                        {variant.name}
                        {variant.sku
                          ? ` (${variant.sku})`
                          : ""}
                        {" — "}
                        {money(
                          Number(
                            variant.price,
                          ),
                        )}
                        {" \u2014 "}{copy.stockLabel}{" "}
                        {variant.stock}
                      </option>
                    ),
                  )}
                </select>

                {selectedProduct &&
                productVariants.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {copy.baseProductHelp}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {copy.quantityLabel}
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(index, {
                      quantity: Number(
                        event.target.value,
                      ),
                    })
                  }
                  disabled={
                    cannotCreateOrder ||
                    isSubmitting
                  }
                  className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    removeItem(index)
                  }
                  disabled={
                    items.length === 1 ||
                    isSubmitting
                  }
                >
                  {copy.remove}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {copy.estimatedTotal}
          </p>

          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {money(
              estimatedTotal,
            )}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {copy.finalTotalNote}
          </p>
        </div>

        <Button
          type="submit"
          disabled={
            cannotCreateOrder ||
            isSubmitting
          }
        >
          {isSubmitting
            ? copy.creating
            : copy.createOrder}
        </Button>
      </div>
    </form>
  );
}
