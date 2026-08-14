"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type NumericValue =
  | number
  | string
  | null;

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: NumericValue;
};

type Variant = {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: NumericValue;
};

type Target = {
  id: string;
  organization_id: string;

  product_id: string | null;
  variant_id: string | null;

  name: string;

  source_name: string;
  source_url: string | null;

  currency: string;

  comparison_basis: string;
  direction: string;

  threshold_percent: NumericValue;

  is_active: boolean;

  created_at: string;
};

type Observation = {
  id: string;
  target_id: string;

  observed_price: NumericValue;
  internal_price_snapshot: NumericValue;
  previous_price: NumericValue;

  change_amount: NumericValue;
  change_percent: NumericValue;

  difference_from_internal: NumericValue;
  difference_from_internal_percent: NumericValue;

  threshold_percent_snapshot: NumericValue;

  comparison_basis_snapshot: string;
  direction_snapshot: string;

  threshold_triggered: boolean;

  source_name: string;
  notes: string | null;

  observed_at: string;
};

type Props = {
  organizationId: string;

  targets: Target[];
  observations: Observation[];

  products: Product[];
  variants: Variant[];
};

function numberValue(
  value: NumericValue,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function money(
  value: NumericValue,
  currency = "IDR",
) {
  const parsed = numberValue(value);

  if (parsed === null) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(parsed);
  } catch {
    return `${currency} ${parsed.toLocaleString(
      "id-ID",
    )}`;
  }
}

function percent(
  value: NumericValue,
) {
  const parsed = numberValue(value);

  if (parsed === null) {
    return "—";
  }

  const prefix =
    parsed > 0 ? "+" : "";

  return `${prefix}${parsed.toFixed(2)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PriceMonitoringManager({
  organizationId,
  targets,
  observations,
  products,
  variants,
}: Props) {
  const router = useRouter();

  const [message, setMessage] =
    useState<string | null>(null);

  const [creating, setCreating] =
    useState(false);

  const [recordingId, setRecordingId] =
    useState<string | null>(null);

  const productMap = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          product,
        ]),
      ),
    [products],
  );

  const variantMap = useMemo(
    () =>
      new Map(
        variants.map((variant) => [
          variant.id,
          variant,
        ]),
      ),
    [variants],
  );

  const latestObservationMap =
    useMemo(() => {
      const map =
        new Map<string, Observation>();

      for (const observation of observations) {
        if (!map.has(observation.target_id)) {
          map.set(
            observation.target_id,
            observation,
          );
        }
      }

      return map;
    }, [observations]);

  function targetItemLabel(
    target: Target,
  ) {
    if (target.product_id) {
      const product =
        productMap.get(target.product_id);

      return product
        ? `${product.name}${
            product.sku
              ? ` • ${product.sku}`
              : ""
          }`
        : "Unknown product";
    }

    if (target.variant_id) {
      const variant =
        variantMap.get(target.variant_id);

      return variant
        ? `${variant.name}${
            variant.sku
              ? ` • ${variant.sku}`
              : ""
          }`
        : "Unknown variant";
    }

    return "Unknown item";
  }

  function targetInternalPrice(
    target: Target,
  ) {
    if (target.product_id) {
      return productMap.get(
        target.product_id,
      )?.price ?? null;
    }

    if (target.variant_id) {
      return variantMap.get(
        target.variant_id,
      )?.price ?? null;
    }

    return null;
  }

  async function createTarget(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);
    setCreating(true);

    const formData =
      new FormData(event.currentTarget);

    const item =
      String(
        formData.get("item") ?? "",
      );

    const [itemType, itemId] =
      item.split(":");

    if (
      !itemId ||
      !["product", "variant"].includes(
        itemType,
      )
    ) {
      setMessage(
        "Pilih product atau variant.",
      );
      setCreating(false);
      return;
    }

    const threshold =
      Number(
        formData.get(
          "threshold_percent",
        ),
      );

    if (
      !Number.isFinite(threshold) ||
      threshold < 0
    ) {
      setMessage(
        "Threshold harus berupa angka 0 atau lebih.",
      );
      setCreating(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("price_monitor_targets")
      .insert({
        organization_id:
          organizationId,

        product_id:
          itemType === "product"
            ? itemId
            : null,

        variant_id:
          itemType === "variant"
            ? itemId
            : null,

        name:
          String(
            formData.get("name") ?? "",
          ).trim(),

        source_name:
          String(
            formData.get(
              "source_name",
            ) ?? "manual",
          ).trim(),

        source_url:
          String(
            formData.get(
              "source_url",
            ) ?? "",
          ).trim() || null,

        currency:
          String(
            formData.get("currency") ??
              "IDR",
          )
            .trim()
            .toUpperCase(),

        comparison_basis:
          String(
            formData.get(
              "comparison_basis",
            ) ?? "previous",
          ),

        direction:
          String(
            formData.get("direction") ??
              "any",
          ),

        threshold_percent:
          threshold,
      });

    if (error) {
      setMessage(error.message);
      setCreating(false);
      return;
    }

    event.currentTarget.reset();

    setMessage(
      "Price monitor target berhasil dibuat.",
    );

    setCreating(false);
    router.refresh();
  }

  async function recordObservation(
    target: Target,
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);
    setRecordingId(target.id);

    const formData =
      new FormData(event.currentTarget);

    const observedPrice =
      Number(
        formData.get(
          "observed_price",
        ),
      );

    if (
      !Number.isFinite(observedPrice) ||
      observedPrice < 0
    ) {
      setMessage(
        "Observed price tidak valid.",
      );

      setRecordingId(null);
      return;
    }

    const supabase = createClient();

    const { error } =
      await supabase.rpc(
        "record_price_observation",
        {
          p_target_id: target.id,
          p_observed_price:
            observedPrice,

          p_notes:
            String(
              formData.get("notes") ??
                "",
            ).trim() || null,
        },
      );

    if (error) {
      setMessage(error.message);
      setRecordingId(null);
      return;
    }

    event.currentTarget.reset();

    setMessage(
      "Price observation berhasil dicatat.",
    );

    setRecordingId(null);
    router.refresh();
  }

  async function toggleTarget(
    target: Target,
  ) {
    setMessage(null);

    const supabase = createClient();

    const { error } =
      await supabase
        .from("price_monitor_targets")
        .update({
          is_active:
            !target.is_active,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", target.id)
        .eq(
          "organization_id",
          organizationId,
        );

    if (error) {
      setMessage(error.message);
      return;
    }

    router.refresh();
  }

  async function deleteTarget(
    target: Target,
  ) {
    if (
      !window.confirm(
        `Delete monitor "${target.name}" dan seluruh history-nya?`,
      )
    ) {
      return;
    }

    setMessage(null);

    const supabase = createClient();

    const { error } =
      await supabase
        .from("price_monitor_targets")
        .delete()
        .eq("id", target.id)
        .eq(
          "organization_id",
          organizationId,
        );

    if (error) {
      setMessage(error.message);
      return;
    }

    router.refresh();
  }

  const alerts =
    observations.filter(
      (observation) =>
        observation.threshold_triggered,
    ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Monitor Targets
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {targets.length}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Active Targets
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {
              targets.filter(
                (target) =>
                  target.is_active,
              ).length
            }
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Triggered Observations
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {alerts}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Create Monitor Target
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Choose a Product or Variant, define an
          external source, and configure the
          percentage threshold.
        </p>

        <form
          onSubmit={createTarget}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <Input
            name="name"
            required
            placeholder="Monitor name"
          />

          <select
            name="item"
            required
            defaultValue=""
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="" disabled>
              Select product / variant
            </option>

            {products.map(
              (product) => (
                <option
                  key={`product:${product.id}`}
                  value={`product:${product.id}`}
                >
                  Product — {product.name}
                  {product.sku
                    ? ` (${product.sku})`
                    : ""}
                </option>
              ),
            )}

            {variants.map(
              (variant) => (
                <option
                  key={`variant:${variant.id}`}
                  value={`variant:${variant.id}`}
                >
                  Variant — {variant.name}
                  {variant.sku
                    ? ` (${variant.sku})`
                    : ""}
                </option>
              ),
            )}
          </select>

          <Input
            name="source_name"
            required
            defaultValue="manual"
            placeholder="Source name"
          />

          <Input
            name="source_url"
            placeholder="Source URL (optional)"
          />

          <Input
            name="currency"
            required
            defaultValue="IDR"
            placeholder="Currency"
          />

          <Input
            name="threshold_percent"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue="5"
            placeholder="Threshold %"
          />

          <select
            name="comparison_basis"
            defaultValue="previous"
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="previous">
              Compare with previous observation
            </option>

            <option value="internal">
              Compare with internal price
            </option>
          </select>

          <select
            name="direction"
            defaultValue="any"
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="any">
              Any movement
            </option>

            <option value="increase">
              Price increase
            </option>

            <option value="decrease">
              Price decrease
            </option>
          </select>

          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={creating}
            >
              {creating
                ? "Creating..."
                : "Create Monitor"}
            </Button>
          </div>
        </form>

        {message ? (
          <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            {message}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {targets.length === 0 ? (
          <div className="rounded-2xl border bg-card px-6 py-12 text-center shadow-sm">
            <p className="font-medium">
              Belum ada Price Monitor Target.
            </p>
          </div>
        ) : (
          targets.map((target) => {
            const latest =
              latestObservationMap.get(
                target.id,
              );

            return (
              <div
                key={target.id}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        {target.name}
                      </h3>

                      <span className="rounded-full border px-2 py-0.5 text-xs">
                        {target.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>

                      {latest?.threshold_triggered ? (
                        <span className="rounded-full border px-2 py-0.5 text-xs font-medium">
                          Threshold Triggered
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {targetItemLabel(
                        target,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Source:{" "}
                      {target.source_name}
                      {" • "}
                      Basis:{" "}
                      {target.comparison_basis}
                      {" • "}
                      Threshold:{" "}
                      {Number(
                        target.threshold_percent,
                      )}
                      %
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        toggleTarget(
                          target,
                        )
                      }
                    >
                      {target.is_active
                        ? "Pause"
                        : "Activate"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        deleteTarget(
                          target,
                        )
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div className="rounded-xl border p-4">
                    <div className="text-xs text-muted-foreground">
                      Internal Price
                    </div>

                    <div className="mt-2 font-medium">
                      {money(
                        targetInternalPrice(
                          target,
                        ),
                        target.currency,
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="text-xs text-muted-foreground">
                      Latest Observed
                    </div>

                    <div className="mt-2 font-medium">
                      {latest
                        ? money(
                            latest.observed_price,
                            target.currency,
                          )
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="text-xs text-muted-foreground">
                      vs Previous
                    </div>

                    <div className="mt-2 font-medium">
                      {latest
                        ? percent(
                            latest.change_percent,
                          )
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="text-xs text-muted-foreground">
                      vs Internal
                    </div>

                    <div className="mt-2 font-medium">
                      {latest
                        ? percent(
                            latest.difference_from_internal_percent,
                          )
                        : "—"}
                    </div>
                  </div>
                </div>

                {target.is_active ? (
                  <form
                    onSubmit={(event) =>
                      recordObservation(
                        target,
                        event,
                      )
                    }
                    className="mt-5 flex flex-col gap-3 md:flex-row"
                  >
                    <Input
                      name="observed_price"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="Observed price"
                      className="md:max-w-xs"
                    />

                    <Input
                      name="notes"
                      placeholder="Notes (optional)"
                    />

                    <Button
                      type="submit"
                      disabled={
                        recordingId ===
                        target.id
                      }
                    >
                      {recordingId ===
                      target.id
                        ? "Recording..."
                        : "Record Price"}
                    </Button>
                  </form>
                ) : null}

                {latest ? (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Latest observation:{" "}
                    {formatDate(
                      latest.observed_at,
                    )}
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">
            Price History
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {observations.length} recent
            observations.
          </p>
        </div>

        {observations.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No price observations yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3">
                    Time
                  </th>

                  <th className="px-6 py-3">
                    Monitor
                  </th>

                  <th className="px-6 py-3">
                    Price
                  </th>

                  <th className="px-6 py-3">
                    vs Previous
                  </th>

                  <th className="px-6 py-3">
                    vs Internal
                  </th>

                  <th className="px-6 py-3">
                    Alert
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {observations.map(
                  (observation) => {
                    const target =
                      targets.find(
                        (item) =>
                          item.id ===
                          observation.target_id,
                      );

                    return (
                      <tr key={observation.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          {formatDate(
                            observation.observed_at,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {target?.name ??
                            "Unknown monitor"}
                        </td>

                        <td className="px-6 py-4">
                          {money(
                            observation.observed_price,
                            target?.currency ??
                              "IDR",
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {percent(
                            observation.change_percent,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {percent(
                            observation.difference_from_internal_percent,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {observation.threshold_triggered
                            ? "Triggered"
                            : "Normal"}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
