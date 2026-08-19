"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/lib/i18n/dictionaries";
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
  const { locale } = useLanguage();
  const copy =
    getDictionary(locale).products.inventoryAdjustment.adjustForm;

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
        copy.invalidAdjustment,
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
      setErrorMessage(copy.updateFailed);
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
          {copy.target}
        </p>

        <p className="mt-1 font-medium">
          {targetName}
        </p>

        <p className="mt-3 text-sm text-muted-foreground">
          {copy.currentStock}
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
          {copy.adjustment}
        </label>

        <Input
          id="quantity_delta"
          name="quantity_delta"
          type="number"
          step="1"
          placeholder={copy.adjustmentPlaceholder}
          required
        />

        <p className="text-xs text-muted-foreground">
          {copy.adjustmentHelp}

        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="note" className="text-sm font-medium">
          {copy.note}
        </label>

        <textarea
          id="note"
          name="note"
          rows={4}
          placeholder={copy.notePlaceholder}
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
          {copy.cancel}
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? copy.adjusting : copy.submit}
        </Button>
      </div>
    </form>
  );
}