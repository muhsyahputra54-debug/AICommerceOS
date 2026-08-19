"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";

type DeleteCopy =
  Dictionary["products"]["variants"]["delete"];

type DeleteProductVariantButtonProps = {
  organizationId: string;
  productId: string;
  variantId: string;
  variantName: string;
  copy: DeleteCopy;
};

export default function DeleteProductVariantButton({
  organizationId,
  productId,
  variantId,
  variantName,
  copy,
}: DeleteProductVariantButtonProps) {
  const router = useRouter();

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed =
      window.confirm(
        `${copy.confirmPrefix}"${variantName}"${copy.confirmSuffix}`,
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsDeleting(true);

    const supabase = createClient();

    const {
      data,
      error,
    } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId)
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
      setErrorMessage(error.message);
      setIsDeleting(false);
      return;
    }

    if (!data) {
      setErrorMessage(
        copy.notFound,
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
        {isDeleting
          ? copy.deleting
          : copy.delete}
      </Button>

      {errorMessage ? (
        <p className="max-w-48 text-xs text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
