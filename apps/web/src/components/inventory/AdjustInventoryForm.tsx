"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type AdjustInventoryFormProps = {
  organizationId: string;
  targetType: "product" | "variant";
  targetId: string;
  targetName: string;
  currentStock: number;
  returnHref: string;
};

export default function AdjustInventoryForm({
  organizationId,
  targetType,
  targetId,
  targetName,
  currentStock,
  returnHref,
}: AdjustInventoryFormProps) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const quantityDelta = Number(formData.get("quantity_delta"));
    const note = String(formData.get("note") ?? "").trim();

    if (!Number.isInteger(quantityDelta) || quantityDelta === 0) {
      setErrorMessage(
        "Perubahan stock harus berupa bilangan bulat selain 0.",
      );
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.rpc("adjust_inventory", {
      p_organization_id: organizationId,
      p_quantity_delta: quantityDelta,
      p_product_id: targetType === "product" ? targetId : null,
      p_variant_id: targetType === "variant" ? targetId : null,
      p_note: note || null,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push(returnHref);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">
          Inventory target
        </p>

        <p className="mt-1 font-medium">
          {targetName}
        </p>

        <p className="mt-3 text-sm text-muted-foreground">
          Current stock
        </p>

        <p className="mt-1 text-2xl font-semibold">
          {currentStock}
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="quantity_delta"
          className="text-sm font-medium"
        >
          Stock adjustment
        </label>

        <Input
          id="quantity_delta"
          name="quantity_delta"
          type="number"
          step="1"
          placeholder="Contoh: 10 atau -3"
          required
        />

        <p className="text-xs text-muted-foreground">
          Gunakan angka positif untuk menambah stock dan angka negatif
          untuk mengurangi stock.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="note" className="text-sm font-medium">
          Note
        </label>

        <textarea
          id="note"
          name="note"
          rows={4}
          placeholder="Contoh: Stock opname gudang"
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
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
          disabled={isSubmitting}
          onClick={() => router.push(returnHref)}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adjusting..." : "Adjust stock"}
        </Button>
      </div>
    </form>
  );
}