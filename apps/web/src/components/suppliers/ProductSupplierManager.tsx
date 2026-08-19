"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/lib/i18n/dictionaries";
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

function formatCurrency(value: number | string | null, locale: "id" | "en") {
  if (value === null || value === "") {
    return "—";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
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
  const { locale } = useLanguage();
  const copy =
    getDictionary(locale).products.supplierSourcing.manager;
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
      return variantNames.get(item.variant_id) ?? copy.unknownVariant;
    }

    return copy.unknownTarget;
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
      setErrorMessage(copy.supplierRequired);
      setIsSubmitting(false);
      return;
    }

    if (
      !targetId ||
      (targetType !== "product" && targetType !== "variant")
    ) {
      setErrorMessage(copy.targetInvalid);
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
      setErrorMessage(copy.moqInvalid);
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
        error.code === "23505" ? copy.duplicateAdd : copy.addFailed,
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
      setErrorMessage(copy.moqInvalid);
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
        error.code === "23505" ? copy.duplicateEdit : copy.editFailed,
      );
      setIsSubmitting(false);
      return;
    }

    if (!data) {
      setErrorMessage(
        copy.relationNotEditable,
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
      supplierNames.get(item.supplier_id) ?? copy.genericSupplier;

    const confirmed = window.confirm(
      copy.deleteConfirm.replace("{supplier}", supplierName).replace("{target}", targetName(item)),
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
      setErrorMessage(copy.deleteFailed);
      setIsSubmitting(false);
      return;
    }

    if (!data) {
      setErrorMessage(
        copy.relationNotDeletable,
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
          <h2 className="text-lg font-semibold">{copy.addTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy.addDescription}
          </p>
        </div>

        {activeSuppliers.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="font-medium">{copy.noActiveTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.noActiveDescription}
            </p>
            <Link
              href="/suppliers/new"
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >{copy.addSupplier}</Link>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="supplier_id" className="text-sm font-medium">
                  {copy.supplier}
                </label>
                <select
                  id="supplier_id"
                  name="supplier_id"
                  required
                  defaultValue=""
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  <option value="" disabled>{copy.selectSupplier}</option>
                  {activeSuppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="target" className="text-sm font-medium">
                  {copy.target}
                </label>
                <select
                  id="target"
                  name="target"
                  required
                  defaultValue={`product:${product.id}`}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  <option value={`product:${product.id}`}>
                    {copy.baseProduct} — {product.name}
                  </option>
                  {variants.map((variant) => (
                    <option
                      key={variant.id}
                      value={`variant:${variant.id}`}
                    >
                      {copy.variant} — {variant.name}
                      {variant.sku ? ` (${variant.sku})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="supplier_sku" className="text-sm font-medium">
                  {copy.supplierSku}
                </label>
                <Input
                  id="supplier_sku"
                  name="supplier_sku"
                  placeholder={copy.optional}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="unit_cost" className="text-sm font-medium">{copy.unitCost}</label>
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
                >{copy.minimumOrderQuantity}</label>
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
                <label htmlFor="lead_time_days" className="text-sm font-medium">{copy.leadTimeDays}</label>
                <Input
                  id="lead_time_days"
                  name="lead_time_days"
                  type="number"
                  min="0"
                  step="1"
                  placeholder={copy.optional}
                />
              </div>

              <div className="space-y-2 md:col-span-2 xl:col-span-3">
                <label htmlFor="notes" className="text-sm font-medium">{copy.notes}</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder={copy.notesPlaceholder}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_preferred"
                className="h-4 w-4 rounded border"
              />
              {copy.preferredForTarget}
            </label>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? copy.saving : copy.addSource}
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
          <h2 className="text-lg font-semibold">{copy.relationsTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy.relationsCount.replace("{count}", String(supplierItems.length))}
          </p>
        </div>

        {supplierItems.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium">{copy.noRelationsTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.noRelationsDescription}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3 font-medium">{copy.target}</th>
                  <th className="px-6 py-3 font-medium">{copy.supplier}</th>
                  <th className="px-6 py-3 font-medium">{copy.supplierSku}</th>
                  <th className="px-6 py-3 font-medium">{copy.unitCost}</th>
                  <th className="px-6 py-3 font-medium">{copy.moq}</th>
                  <th className="px-6 py-3 font-medium">{copy.leadTime}</th>
                  <th className="px-6 py-3 font-medium">{copy.preferred}</th>
                  <th className="px-6 py-3 font-medium">{copy.actions}</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {supplierItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 font-medium">
                      {targetName(item)}
                    </td>
                    <td className="px-6 py-4">
                      {supplierNames.get(item.supplier_id) ?? copy.unknownSupplier}
                    </td>
                    <td className="px-6 py-4">
                      {item.supplier_sku ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {formatCurrency(item.unit_cost, locale)}
                    </td>
                    <td className="px-6 py-4">
                      {item.minimum_order_quantity}
                    </td>
                    <td className="px-6 py-4">
                      {item.lead_time_days === null
                        ? "—"
                        : copy.days.replace("{count}", String(item.lead_time_days))}
                    </td>
                    <td className="px-6 py-4">
                      {item.is_preferred ? (
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{copy.preferred}</span>
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
                        >{copy.edit}</Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          disabled={isSubmitting}
                        >{copy.delete}</Button>
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
            <h2 className="text-lg font-semibold">{copy.editTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {supplierNames.get(editingItem.supplier_id) ?? copy.unknownSupplier}
              {" — "}
              {targetName(editingItem)}
            </p>
          </div>

          <form onSubmit={handleEdit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit_supplier_sku">
                  {copy.supplierSku}
                </label>
                <Input
                  id="edit_supplier_sku"
                  name="supplier_sku"
                  defaultValue={editingItem.supplier_sku ?? ""}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit_unit_cost">{copy.unitCost}</label>
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
                  {copy.moq}
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
                <label className="text-sm font-medium" htmlFor="edit_lead_time">{copy.leadTime}</label>
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
              <label className="text-sm font-medium" htmlFor="edit_notes">{copy.notes}</label>
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
              {copy.preferredForTarget}
            </label>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? copy.saving : copy.saveChanges}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingId(null)}
                disabled={isSubmitting}
              >{copy.cancel}</Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
