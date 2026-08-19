"use client";

import {
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";

type EditableProductVariant = {
  id: string;
  name: string;
  sku: string;
  price: number | string;
  cost_price: number | string;
  stock: number;
  status: string;
};

type VariantCopy =
  Dictionary["products"]["variants"];

type EditProductVariantFormProps = {
  organizationId: string;
  productId: string;
  variant: EditableProductVariant;
  copy: VariantCopy;
};

export default function EditProductVariantForm({
  organizationId,
  productId,
  variant,
  copy,
}: EditProductVariantFormProps) {
  const router = useRouter();

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    const formData =
      new FormData(event.currentTarget);

    const name = String(
      formData.get("name") ?? "",
    ).trim();

    const sku = String(
      formData.get("sku") ?? "",
    ).trim();

    const price = Number(
      formData.get("price"),
    );

    const costPrice = Number(
      formData.get("cost_price"),
    );

    const stock = Number(
      formData.get("stock"),
    );

    const status = String(
      formData.get("status") ?? "",
    );

    if (!name) {
      setErrorMessage(
        copy.validation.nameRequired,
      );

      setIsSubmitting(false);
      return;
    }

    if (!sku) {
      setErrorMessage(
        copy.validation.skuRequired,
      );

      setIsSubmitting(false);
      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setErrorMessage(
        copy.validation.priceInvalid,
      );

      setIsSubmitting(false);
      return;
    }

    if (
      !Number.isFinite(costPrice) ||
      costPrice < 0
    ) {
      setErrorMessage(
        copy.validation.costPriceInvalid,
      );

      setIsSubmitting(false);
      return;
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setErrorMessage(
        copy.validation.stockInvalid,
      );

      setIsSubmitting(false);
      return;
    }

    if (
      status !== "active" &&
      status !== "inactive"
    ) {
      setErrorMessage(
        copy.validation.statusInvalid,
      );

      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const {
      data,
      error,
    } = await supabase
      .from("product_variants")
      .update({
        name,
        sku,
        price,
        cost_price: costPrice,
        stock,
        status,
      })
      .eq("id", variant.id)
      .eq(
        "product_id",
        productId,
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .select("id")
      .maybeSingle();

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? copy.validation.skuInUse
          : error.message,
      );

      setIsSubmitting(false);
      return;
    }

    if (!data) {
      setErrorMessage(
        copy.validation.notFound,
      );

      setIsSubmitting(false);
      return;
    }

    router.push(
      `/products/${productId}/variants`,
    );
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="name"
            className="text-sm font-medium"
          >
            {copy.form.variantName}
          </label>

          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={variant.name}
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="sku"
            className="text-sm font-medium"
          >
            {copy.form.sku}
          </label>

          <Input
            id="sku"
            name="sku"
            type="text"
            defaultValue={variant.sku}
            required
          />

          <p className="text-xs text-muted-foreground">
            {copy.form.skuHelp}
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="price"
            className="text-sm font-medium"
          >
            {copy.form.sellingPrice}
          </label>

          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue={
              String(variant.price)
            }
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="cost_price"
            className="text-sm font-medium"
          >
            {copy.form.costPrice}
          </label>

          <Input
            id="cost_price"
            name="cost_price"
            type="number"
            min="0"
            step="1"
            defaultValue={
              String(
                variant.cost_price,
              )
            }
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="stock"
            className="text-sm font-medium"
          >
            {copy.form.stock}
          </label>

          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={
              String(variant.stock)
            }
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="status"
            className="text-sm font-medium"
          >
            {copy.form.status}
          </label>

          <select
            id="status"
            name="status"
            defaultValue={
              variant.status ===
              "inactive"
                ? "inactive"
                : "active"
            }
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="active">
              {copy.form.active}
            </option>

            <option value="inactive">
              {copy.form.inactive}
            </option>
          </select>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              `/products/${productId}/variants`,
            )
          }
          disabled={isSubmitting}
        >
          {copy.form.cancel}
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? copy.form.saving
            : copy.edit.saveChanges}
        </Button>
      </div>
    </form>
  );
}
