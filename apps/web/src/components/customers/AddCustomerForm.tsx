"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";

type AddCustomerFormProps = {
  organizationId: string;
};

export default function AddCustomerForm({
  organizationId,
}: AddCustomerFormProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy = getDictionary(locale).customers.form;
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
      setErrorMessage(copy.validation.nameRequired);
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.from("customers").insert({
      name,
      email: email || null,
      phone: phone || null,
      organization_id: organizationId,
    });

    if (error) {
      setErrorMessage(copy.errors.createFailed);
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
            {copy.nameLabel}
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder={copy.namePlaceholder}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            {copy.emailLabel}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={copy.emailPlaceholder}
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
            placeholder={copy.phonePlaceholder}
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
          {copy.cancel}
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? copy.saving : copy.saveCustomer}
        </Button>
      </div>
    </form>
  );
}