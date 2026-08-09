"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type DeleteCustomerButtonProps = {
  organizationId: string;
  customerId: string;
  customerName: string;
};

export default function DeleteCustomerButton({
  organizationId,
  customerId,
  customerName,
}: DeleteCustomerButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Hapus pelanggan "${customerName}"? Tindakan ini tidak dapat dibatalkan.`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsDeleting(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId)
      .eq("organization_id", organizationId)
      .select("id")
      .maybeSingle();

    if (error) {
      setErrorMessage(
        error.code === "23503"
          ? "Pelanggan tidak dapat dihapus karena sudah digunakan pada order."
          : error.message,
      );
      setIsDeleting(false);
      return;
    }

    if (!data) {
      setErrorMessage(
        "Pelanggan tidak ditemukan atau tidak dapat dihapus.",
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