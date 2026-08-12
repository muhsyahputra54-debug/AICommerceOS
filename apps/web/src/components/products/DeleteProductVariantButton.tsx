"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type DeleteProductVariantButtonProps = {
  organizationId: string;
  productId: string;
  variantId: string;
  variantName: string;
};

export default function DeleteProductVariantButton({
  organizationId,
  productId,
  variantId,
  variantName,
}: DeleteProductVariantButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Hapus variant "${variantName}"? Tindakan ini tidak dapat dibatalkan.`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsDeleting(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId)
      .eq("product_id", productId)
      .eq("organization_id", organizationId)
      .select("id")
      .maybeSingle();

    if (error) {
      setErrorMessage(error.message);
      setIsDeleting(false);
      return;
    }

    if (!data) {
      setErrorMessage(
        "Variant tidak ditemukan atau tidak dapat dihapus.",
      );
      setIsDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>

      {errorMessage ? (
        <p className="max-w-48 text-xs text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}