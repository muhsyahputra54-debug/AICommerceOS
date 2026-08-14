"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  sku: string | null;
};

type Variant = {
  id: string;
  name: string;
  sku: string;
};

type Supplier = {
  id: string;
  name: string;
  status: string;
};

type SupplierItem = {
  id: string;
  supplier_id: string;
  target_type: string;
  product_id: string | null;
  variant_id: string | null;
  supplier_sku: string | null;
  unit_cost: number | string | null;
  minimum_order_quantity: number;
  lead_time_days: number | null;
  is_preferred: boolean;
  notes: string | null;
  created_at: string;
};

type ProductSupplierManagerProps = {
  organizationId: string;
  product: Product;
  variants: Variant[];
  suppliers: Supplier[];
  supplierItems: SupplierItem[];
};

function formatCurrency(value: number | string | null) {
  if (value === null || value === "") {
    return "—";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
}

function optionalNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ProductSupplierManager({
  organizationId,
  product,
  variants,
  suppliers,
  supplierItems,
}: ProductSupplierManagerProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.status === "active",
  );

  const supplierNames = new Map(
    suppliers.map((supplier) => [supplier.id, supplier.name]),
  );

  const variantNames = new Map(
    variants.map((variant) => [
      variant.id,
      variant.sku
        ? `${variant.name} (${variant.sku})`
        : variant.name,
    ]),
  );

  const editingItem =
    supplierItems.find((item) => item.id === editingId) ?? null;

  function targetName(item: SupplierItem) {
    if (item.target_type === "product") {
      return product.sku
        ? `${product.name} (${product.sku})`
        : product.name;
    }

    if (item.variant_id) {
      return variantNames.get(item.variant_id) ?? "Unknown variant";
    }

    return "Unknown target";
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const supplierId = String(formData.get("supplier_id") ?? "");
    const target = String(formData.get("target") ?? "");
    const [targetType, targetId] = target.split(":");

    if (!supplierId) {
      setErrorMessage("Supplier wajib dipilih.");
      setIsSubmitting(false);
      return;
    }

    if (
      !targetId ||
      (targetType !== "product" && targetType !== "variant")
    ) {
      setErrorMessage("Target sourcing tidak valid.");
      setIsSubmitting(false);
      return;
    }

    const minimumOrderQuantity = Number(
      formData.get("minimum_order_quantity") ?? 1,
    );

    if (
      !Number.isInteger(minimumOrderQuantity) ||
      minimumOrderQuantity < 1
    ) {
      setErrorMessage("MOQ minimal 1.");
      setIsSubmitting(false);
      return;
    }

    const supplierSku = String(
      formData.get("supplier_sku") ?? "",
    ).trim();

    const notes = String(formData.get("notes") ?? "").trim();

    const supabase = createClient();

    const { error } = await supabase.from("supplier_items").insert({
      organization_id: organizationId,
      supplier_id: supplierId,
      target_type: targetType,
      product_id: targetType === "product" ? targetId : null,
      variant_id: targetType === "variant" ? targetId : null,
      supplier_sku: supplierSku || null,
      unit_cost: optionalNumber(formData.get("unit_cost")),
      minimum_order_quantity: minimumOrderQuantity,
      lead_time_days: optionalNumber(formData.get("lead_time_days")),
      is_preferred: formData.get("is_preferred") === "on",
      notes: notes || null,
    });

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "Relasi supplier sudah ada atau target sudah memiliki preferred supplier."
          : error.message,
      );
      setIsSubmitting(false);
      return;
    }

    form.reset();
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingItem) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const minimumOrderQuantity = Number(
      formData.get("minimum_order_quantity") ?? 1,
    );

    if (
      !Number.isInteger(minimumOrderQuantity) ||
      minimumOrderQuantity < 1
    ) {
      setErrorMessage("MOQ minimal 1.");
      setIsSubmitting(false);
      return;
    }

    const supplierSku = String(
      formData.get("supplier_sku") ?? "",
    ).trim();

    const notes = String(formData.get("notes") ?? "").trim();

    const supabase = createClient();

    const { data, error } = await supabase
      .from("supplier_items")
      .update({
        supplier_sku: supplierSku || null,
        unit_cost: optionalNumber(formData.get("unit_cost")),
        minimum_order_quantity: minimumOrderQuantity,
        lead_time_days: optionalNumber(formData.get("lead_time_days")),
        is_preferred: formData.get("is_preferred") === "on",
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingItem.id)
      .eq("organization_id", organizationId)
      .select("id")
      .maybeSingle();

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "Target sudah memiliki preferred supplier lain."
          : error.message,
      );
      setIsSubmitting(false);
      return;
    }

    if (!data) {
      setErrorMessage(
        "Relasi supplier tidak ditemukan atau tidak dapat diubah.",
      );
      setIsSubmitting(false);
      return;
    }

    setEditingId(null);
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleDelete(item: SupplierItem) {
    const supplierName =
      supplierNames.get(item.supplier_id) ?? "supplier";

    const confirmed = window.confirm(
      `Hapus relasi ${supplierName} dari ${targetName(item)}?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("supplier_items")
      .delete()
      .eq("id", item.id)
      .eq("organization_id", organizationId)
      .select("id")
      .maybeSingle();

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (!data) {
      setErrorMessage(
        "Relasi supplier tidak ditemukan atau tidak dapat dihapus.",
      );
      setIsSubmitting(false);
      return;
    }

    if (editingId === item.id) {
      setEditingId(null);
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Add Supplier Source</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hubungkan supplier ke base product atau product variant.
          </p>
        </div>

        {activeSuppliers.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="font-medium">Belum ada supplier aktif</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tambahkan supplier terlebih dahulu sebelum membuat sourcing relation.
            </p>
            <Link
              href="/suppliers/new"
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Add Supplier
            </Link>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="supplier_id" className="text-sm font-medium">
                  Supplier
                </label>
                <select
                  id="supplier_id"
                  name="supplier_id"
                  required
                  defaultValue=""
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  <option value="" disabled>Select supplier</option>
                  {activeSuppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="target" className="text-sm font-medium">
                  Target
                </label>
                <select
                  id="target"
                  name="target"
                  required
                  defaultValue={`product:${product.id}`}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  <option value={`product:${product.id}`}>
                    Base Product — {product.name}
                  </option>
                  {variants.map((variant) => (
                    <option
                      key={variant.id}
                      value={`variant:${variant.id}`}
                    >
                      Variant — {variant.name}
                      {variant.sku ? ` (${variant.sku})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="supplier_sku" className="text-sm font-medium">
                  Supplier SKU
                </label>
                <Input
                  id="supplier_sku"
                  name="supplier_sku"
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="unit_cost" className="text-sm font-medium">
                  Unit Cost
                </label>
                <Input
                  id="unit_cost"
                  name="unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="minimum_order_quantity"
                  className="text-sm font-medium"
                >
                  Minimum Order Quantity
                </label>
                <Input
                  id="minimum_order_quantity"
                  name="minimum_order_quantity"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lead_time_days" className="text-sm font-medium">
                  Lead Time (days)
                </label>
                <Input
                  id="lead_time_days"
                  name="lead_time_days"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2 md:col-span-2 xl:col-span-3">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Optional sourcing notes"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_preferred"
                className="h-4 w-4 rounded border"
              />
              Preferred supplier for this target
            </label>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add supplier source"}
            </Button>
          </form>
        )}
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">Sourcing Relations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {supplierItems.length} supplier relation ditemukan.
          </p>
        </div>

        {supplierItems.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium">Belum ada supplier relation</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tambahkan supplier source untuk product atau variant.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3 font-medium">Target</th>
                  <th className="px-6 py-3 font-medium">Supplier</th>
                  <th className="px-6 py-3 font-medium">Supplier SKU</th>
                  <th className="px-6 py-3 font-medium">Unit Cost</th>
                  <th className="px-6 py-3 font-medium">MOQ</th>
                  <th className="px-6 py-3 font-medium">Lead Time</th>
                  <th className="px-6 py-3 font-medium">Preferred</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {supplierItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 font-medium">
                      {targetName(item)}
                    </td>
                    <td className="px-6 py-4">
                      {supplierNames.get(item.supplier_id) ?? "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      {item.supplier_sku ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {formatCurrency(item.unit_cost)}
                    </td>
                    <td className="px-6 py-4">
                      {item.minimum_order_quantity}
                    </td>
                    <td className="px-6 py-4">
                      {item.lead_time_days === null
                        ? "—"
                        : `${item.lead_time_days} days`}
                    </td>
                    <td className="px-6 py-4">
                      {item.is_preferred ? (
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          Preferred
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setErrorMessage(null);
                            setEditingId(item.id);
                          }}
                          disabled={isSubmitting}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          disabled={isSubmitting}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingItem ? (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Edit Sourcing Terms</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {supplierNames.get(editingItem.supplier_id) ?? "Supplier"}
              {" — "}
              {targetName(editingItem)}
            </p>
          </div>

          <form onSubmit={handleEdit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit_supplier_sku">
                  Supplier SKU
                </label>
                <Input
                  id="edit_supplier_sku"
                  name="supplier_sku"
                  defaultValue={editingItem.supplier_sku ?? ""}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit_unit_cost">
                  Unit Cost
                </label>
                <Input
                  id="edit_unit_cost"
                  name="unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingItem.unit_cost ?? ""}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit_moq">
                  MOQ
                </label>
                <Input
                  id="edit_moq"
                  name="minimum_order_quantity"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={editingItem.minimum_order_quantity}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit_lead_time">
                  Lead Time
                </label>
                <Input
                  id="edit_lead_time"
                  name="lead_time_days"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={editingItem.lead_time_days ?? ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit_notes">
                Notes
              </label>
              <textarea
                id="edit_notes"
                name="notes"
                rows={3}
                defaultValue={editingItem.notes ?? ""}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_preferred"
                defaultChecked={editingItem.is_preferred}
                className="h-4 w-4 rounded border"
              />
              Preferred supplier for this target
            </label>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingId(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
