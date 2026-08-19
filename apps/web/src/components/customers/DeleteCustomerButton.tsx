"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/dictionaries";
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
  const { locale } = useLanguage();
  const copy = getDictionary(locale).customers.delete;
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `${copy.confirmPrefix} "${customerName}"? ${copy.confirmSuffix}`,
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
          ? copy.errors.inUse
          : copy.errors.deleteFailed,
      );
      setIsDeleting(false);
      return;
    }

    if (!data) {
      setErrorMessage(
        copy.errors.notFoundOrCannotDelete,
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
        {isDeleting ? copy.deleting : copy.delete}
      </Button>

      {errorMessage ? (
        <p className="max-w-48 text-xs text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}