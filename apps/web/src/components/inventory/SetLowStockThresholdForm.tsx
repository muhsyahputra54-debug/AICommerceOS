"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type SetLowStockThresholdFormProps = {
  organizationId: string;
  targetType: "product" | "variant";
  targetId: string;
  currentThreshold: number;
};

export default function SetLowStockThresholdForm({
  organizationId,
  targetType,
  targetId,
  currentThreshold,
}: SetLowStockThresholdFormProps) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const threshold = Number(formData.get("low_stock_threshold"));

    if (!Number.isInteger(threshold) || threshold < 0) {
      setErrorMessage(
        "Low stock threshold harus berupa bilangan bulat 0 atau lebih.",
      );
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.rpc("set_low_stock_threshold", {
      p_organization_id: organizationId,
      p_low_stock_threshold: threshold,
      p_product_id: targetType === "product" ? targetId : null,
      p_variant_id: targetType === "variant" ? targetId : null,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("Low stock threshold berhasil diperbarui.");
    setIsSubmitting(false);

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          Low Stock Alert
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Inventory akan ditandai low stock ketika stock lebih besar
          dari 0 dan kurang dari atau sama dengan threshold ini.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="low_stock_threshold"
          className="text-sm font-medium"
        >
          Low stock threshold
        </label>

        <Input
          id="low_stock_threshold"
          name="low_stock_threshold"
          type="number"
          min="0"
          step="1"
          defaultValue={currentThreshold}
          required
        />
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border px-4 py-3 text-sm">
          {successMessage}
        </div>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save threshold"}
      </Button>
    </form>
  );
}