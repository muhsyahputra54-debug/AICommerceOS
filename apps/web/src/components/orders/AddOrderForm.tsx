"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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

type OrderItemInput = {
  productId: string;
  quantity: number;
};

type AddOrderFormProps = {
  organizationId: string;
  customers: Customer[];
  products: Product[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AddOrderForm({
  organizationId,
  customers,
  products,
}: AddOrderFormProps) {
  const router = useRouter();

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<OrderItemInput[]>([
    {
      productId: "",
      quantity: 1,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const estimatedTotal = useMemo(() => {
    return items.reduce((total, item) => {
      const product = products.find(
        (candidate) => candidate.id === item.productId,
      );

      if (!product) {
        return total;
      }

      return total + Number(product.price) * item.quantity;
    }, 0);
  }, [items, products]);

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

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      {
        productId: "",
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);

    if (!customerId) {
      setErrorMessage("Pilih customer terlebih dahulu.");
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
        "Setiap item harus memiliki produk dan quantity lebih dari 0.",
      );
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();

    const { error } = await supabase.rpc("create_order", {
      p_organization_id: organizationId,
      p_customer_id: customerId,
      p_items: items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/orders");
    router.refresh();
  }

  const cannotCreateOrder =
    customers.length === 0 || products.length === 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm"
    >
      {cannotCreateOrder ? (
        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          {customers.length === 0
            ? "Tambahkan minimal satu customer sebelum membuat order."
            : "Tambahkan minimal satu produk aktif sebelum membuat order."}
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="customer"
          className="text-sm font-medium"
        >
          Customer
        </label>

        <select
          id="customer"
          value={customerId}
          onChange={(event) =>
            setCustomerId(event.target.value)
          }
          disabled={cannotCreateOrder || isSubmitting}
          className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">Pilih customer</option>

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
              Order Items
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Harga final dan total dihitung ulang oleh database.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            disabled={cannotCreateOrder || isSubmitting}
          >
            Add item
          </Button>
        </div>

        {items.map((item, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_140px_auto]"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Product
              </label>

              <select
                value={item.productId}
                onChange={(event) =>
                  updateItem(index, {
                    productId: event.target.value,
                  })
                }
                disabled={cannotCreateOrder || isSubmitting}
                className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih produk</option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} — {formatCurrency(Number(product.price))}
                    {" — "}stock {product.stock}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Quantity
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={item.quantity}
                onChange={(event) =>
                  updateItem(index, {
                    quantity: Number(event.target.value),
                  })
                }
                disabled={cannotCreateOrder || isSubmitting}
                className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => removeItem(index)}
                disabled={
                  items.length === 1 ||
                  cannotCreateOrder ||
                  isSubmitting
                }
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">
          Estimasi total
        </p>

        <p className="mt-1 text-xl font-semibold">
          {formatCurrency(estimatedTotal)}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Nilai ini hanya preview. Total resmi dihitung oleh RPC
          dari harga produk di database.
        </p>
      </div>

      {errorMessage ? (
        <p className="text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={cannotCreateOrder || isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create order"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/orders")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}