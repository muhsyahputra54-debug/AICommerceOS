"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type AddSupplierFormProps = {
  organizationId: string;
};

export default function AddSupplierForm({
  organizationId,
}: AddSupplierFormProps) {
  const router = useRouter();
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
      setErrorMessage("Nama supplier wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.from("suppliers").insert({
      organization_id: organizationId,
      name,
      contact_name: contactName || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
      status,
    });

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "Nama supplier sudah digunakan pada organization ini."
          : error.message,
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
            Supplier name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Contoh: PT Supplier Nusantara"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="contact_name" className="text-sm font-medium">
            Contact person
          </label>
          <Input
            id="contact_name"
            name="contact_name"
            type="text"
            placeholder="Nama PIC supplier"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="active"
            className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="supplier@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+62 812 3456 7890"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="address" className="text-sm font-medium">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            placeholder="Alamat supplier"
            className="flex w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="notes" className="text-sm font-medium">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Catatan tambahan mengenai supplier"
            className="flex w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save supplier"}
        </Button>
      </div>
    </form>
  );
}
