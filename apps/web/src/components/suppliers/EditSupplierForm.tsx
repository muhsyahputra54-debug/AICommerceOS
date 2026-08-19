"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";

type EditableSupplier = {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: string;
};

type EditSupplierFormProps = {
  organizationId: string;
  supplier: EditableSupplier;
};

export default function EditSupplierForm({
  organizationId,
  supplier,
}: EditSupplierFormProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy = getDictionary(locale).suppliers.form;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") ?? "").trim();
    const contactName = String(
      formData.get("contact_name") ?? "",
    ).trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const status = String(formData.get("status") ?? "active");

    if (!name) {
      setErrorMessage(copy.validation.nameRequired);
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("suppliers")
      .update({
        name,
        contact_name: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", supplier.id)
      .eq("organization_id", organizationId)
      .select("id")
      .maybeSingle();

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? copy.errors.duplicateName
          : copy.errors.updateFailed,
      );
      setIsSubmitting(false);
      return;
    }

    if (!data) {
      setErrorMessage(
        copy.errors.notFoundOrCannotUpdate,
      );
      setIsSubmitting(false);
      return;
    }

    router.push("/suppliers");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="name" className="text-sm font-medium">
            {copy.nameLabel}
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={supplier.name}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="contact_name" className="text-sm font-medium">
            {copy.contactLabel}
          </label>
          <Input
            id="contact_name"
            name="contact_name"
            type="text"
            defaultValue={supplier.contact_name ?? ""}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            {copy.statusLabel}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={supplier.status}
            className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="active">{copy.statuses.active}</option>
            <option value="inactive">{copy.statuses.inactive}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            {copy.emailLabel}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={supplier.email ?? ""}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            {copy.phoneLabel}
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={supplier.phone ?? ""}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="address" className="text-sm font-medium">
            {copy.addressLabel}
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            defaultValue={supplier.address ?? ""}
            className="flex w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="notes" className="text-sm font-medium">
            {copy.notesLabel}
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={supplier.notes ?? ""}
            className="flex w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/suppliers")}
          disabled={isSubmitting}
        >
          {copy.cancel}
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? copy.saving : copy.saveChanges}
        </Button>
      </div>
    </form>
  );
}
