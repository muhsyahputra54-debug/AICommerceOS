"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";

type OrderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled";

type OrderStatusActionsProps = {
  organizationId: string;
  orderId: string;
  status: OrderStatus;
};

export default function OrderStatusActions({
  organizationId,
  orderId,
  status,
}: OrderStatusActionsProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy =
    getDictionary(locale).orders.statusActions;

  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );

  async function updateStatus(
    newStatus: "processing" | "completed" | "cancelled",
  ) {
    if (newStatus === "cancelled") {
      const confirmed = window.confirm(
        copy.cancelConfirm,
      );

      if (!confirmed) {
        return;
      }
    }

    setErrorMessage(null);
    setIsUpdating(true);

    const supabase = createClient();

    const { error } = await supabase.rpc("update_order_status", {
      p_organization_id: organizationId,
      p_order_id: orderId,
      p_new_status: newStatus,
    });

    if (error) {
      setErrorMessage(copy.errors.updateFailed);
      setIsUpdating(false);
      return;
    }

    router.refresh();
    setIsUpdating(false);
  }

  if (status === "completed" || status === "cancelled") {
    return (
      <span className="text-xs text-muted-foreground">
        {copy.final}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {status === "pending" ? (
          <Button
            type="button"
            size="sm"
            onClick={() => updateStatus("processing")}
            disabled={isUpdating}
          >
            {isUpdating ? copy.updating : copy.process}
          </Button>
        ) : null}

        {status === "processing" ? (
          <Button
            type="button"
            size="sm"
            onClick={() => updateStatus("completed")}
            disabled={isUpdating}
          >
            {isUpdating ? copy.updating : copy.complete}
          </Button>
        ) : null}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => updateStatus("cancelled")}
          disabled={isUpdating}
        >
          {copy.cancel}
        </Button>
      </div>

      {errorMessage ? (
        <p className="max-w-56 text-xs text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}