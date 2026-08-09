"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type AddProductFormProps = {
  organizationId: string;
};

export default function AddProductForm({
  organizationId,
}: AddProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const status = String(formData.get("status") ?? "");

    if (!name) {
      setErrorMessage("Nama produk wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setErrorMessage("Harga harus bernilai 0 atau lebih.");
      setIsSubmitting(false);
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setErrorMessage("Stok harus berupa bilangan bulat 0 atau lebih.");
      setIsSubmitting(false);
      return;
    }

    if (status !== "active" && status !== "inactive") {
      setErrorMessage("Status produk tidak valid.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.from("products").insert({
      name,
      description: description || null,
      price,
      stock,
      status,
      organization_id: organizationId,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="name" className="text-sm font-medium">
            Product name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Contoh: Premium T-Shirt"
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Deskripsi singkat produk"
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">
            Price
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
          <label htmlFor="stock" className="text-sm font-medium">
            Stock
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
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="active"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
          onClick={() => router.push("/products")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save product"}
        </Button>
      </div>
    </form>
  );
}
