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

type ProductCategory = {
  id: string;
  name: string;
};

type ProductWorkflowCopy =
  Dictionary["products"]["workflow"];

type AddProductFormProps = {
  organizationId: string;
  categories: ProductCategory[];
  copy: ProductWorkflowCopy;
  successPath?: string;
  cancelPath?: string;
};

export default function AddProductForm({
  organizationId,
  categories,
  copy,
  successPath = "/products",
  cancelPath = "/products",
}: AddProductFormProps) {
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

    const description = String(
      formData.get("description") ?? "",
    ).trim();

    const sku = String(
      formData.get("sku") ?? "",
    ).trim();

    const categoryId = String(
      formData.get("category_id") ?? "",
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

    const { error } = await supabase
      .from("products")
      .insert({
        name,
        description:
          description || null,
        sku: sku || null,
        category_id:
          categoryId || null,
        price,
        cost_price: costPrice,
        stock,
        status,
        organization_id:
          organizationId,
      });

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? copy.validation.skuInUse
          : error.message,
      );

      setIsSubmitting(false);
      return;
    }

    router.push(successPath);
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
            {copy.fields.productName}
          </label>

          <Input
            id="name"
            name="name"
            type="text"
            placeholder={
              copy.fields
                .productNamePlaceholder
            }
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="sku"
            className="text-sm font-medium"
          >
            {copy.fields.sku}
          </label>

          <Input
            id="sku"
            name="sku"
            type="text"
            placeholder={
              copy.fields.skuPlaceholder
            }
          />

          <p className="text-xs text-muted-foreground">
            {copy.fields.skuHelp}
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="category_id"
            className="text-sm font-medium"
          >
            {copy.fields.category}
          </label>

          <select
            id="category_id"
            name="category_id"
            defaultValue=""
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">
              {copy.fields.noCategory}
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="description"
            className="text-sm font-medium"
          >
            {copy.fields.description}
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder={
              copy.fields
                .descriptionPlaceholder
            }
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="price"
            className="text-sm font-medium"
          >
            {copy.fields.sellingPrice}
          </label>

          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue="0"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="cost_price"
            className="text-sm font-medium"
          >
            {copy.fields.costPrice}
          </label>

          <Input
            id="cost_price"
            name="cost_price"
            type="number"
            min="0"
            step="1"
            defaultValue="0"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="stock"
            className="text-sm font-medium"
          >
            {copy.fields.stock}
          </label>

          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue="0"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="status"
            className="text-sm font-medium"
          >
            {copy.fields.status}
          </label>

          <select
            id="status"
            name="status"
            defaultValue="active"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="active">
              {copy.fields.active}
            </option>

            <option value="inactive">
              {copy.fields.inactive}
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
            router.push(cancelPath)
          }
          disabled={isSubmitting}
        >
          {copy.actions.cancel}
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? copy.actions.saving
            : copy.add.saveProduct}
        </Button>
      </div>
    </form>
  );
}
