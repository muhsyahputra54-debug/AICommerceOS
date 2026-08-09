"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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

  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );

  async function updateStatus(
    newStatus: "processing" | "completed" | "cancelled",
  ) {
    if (newStatus === "cancelled") {
      const confirmed = window.confirm(
        "Batalkan order ini? Perubahan status mengikuti aturan inventory yang berlaku.",
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
      setErrorMessage(error.message);
      setIsUpdating(false);
      return;
    }

    router.refresh();
    setIsUpdating(false);
  }

  if (status === "completed" || status === "cancelled") {
    return (
      <span className="text-xs text-muted-foreground">
        Final
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
            {isUpdating ? "Updating..." : "Process"}
          </Button>
        ) : null}

        {status === "processing" ? (
          <Button
            type="button"
            size="sm"
            onClick={() => updateStatus("completed")}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Complete"}
          </Button>
        ) : null}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => updateStatus("cancelled")}
          disabled={isUpdating}
        >
          Cancel
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