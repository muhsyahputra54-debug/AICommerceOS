"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { getDictionary } from "@/lib/i18n/dictionaries";

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
  const { locale } = useLanguage();
  const copy = getDictionary(locale).products.delete;

  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `${copy.confirmPrefix}"${productName}"${copy.confirmSuffix}`,
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
          ? copy.inUse
          : error.message,
      );

      setIsDeleting(false);
      return;
    }

    if (!data) {
      setErrorMessage(copy.notFound);
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
