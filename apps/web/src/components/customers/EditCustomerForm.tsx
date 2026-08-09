"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type EditableCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type EditCustomerFormProps = {
  organizationId: string;
  customer: EditableCustomer;
};

export default function EditCustomerForm({
  organizationId,
  customer,
}: EditCustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!name) {
      setErrorMessage("Nama pelanggan wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("customers")
      .update({
        name,
        email: email || null,
        phone: phone || null,
      })
      .eq("id", customer.id)
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
        "Pelanggan tidak ditemukan atau tidak dapat diubah.",
      );
      setIsSubmitting(false);
      return;
    }

    router.push("/customers");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="name" className="text-sm font-medium">
            Customer name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={customer.name}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={customer.email ?? ""}
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
            defaultValue={customer.phone ?? ""}
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
          onClick={() => router.push("/customers")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}