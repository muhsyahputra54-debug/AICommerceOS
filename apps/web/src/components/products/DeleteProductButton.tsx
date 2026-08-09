"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type DeleteProductButtonProps = {
  organizationId: string;
  productId: string;
  productName: string;
};

export default function DeleteProductButton({
  organizationId,
  productId,
  productName,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Hapus produk "${productName}"? Tindakan ini tidak dapat dibatalkan.`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsDeleting(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("organization_id", organizationId)
      .select("id")
      .maybeSingle();

    if (error) {
      setErrorMessage(
        error.code === "23503"
          ? "Produk tidak dapat dihapus karena sudah digunakan pada order."
          : error.message,
      );
      setIsDeleting(false);
      return;
    }

    if (!data) {
      setErrorMessage("Produk tidak ditemukan atau tidak dapat dihapus.");
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
        <p className="max-w-48 text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}