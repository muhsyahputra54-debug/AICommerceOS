"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type MarketplaceAccount = {
  id: string;
  provider: string;
  name: string;
  external_shop_id: string | null;
  status: string;
  last_synced_at: string | null;
  created_at: string;
};

type MarketplaceAccountManagerProps = {
  organizationId: string;
  accounts: MarketplaceAccount[];
};

export default function MarketplaceAccountManager({
  organizationId,
  accounts,
}: MarketplaceAccountManagerProps) {
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const editingAccount =
    accounts.find((account) => account.id === editingId) ?? null;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const provider = String(formData.get("provider") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const externalShopId = String(
      formData.get("external_shop_id") ?? "",
    ).trim();

    if (!provider || !name) {
      setErrorMessage("Provider dan nama marketplace wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.from("marketplace_accounts").insert({
      organization_id: organizationId,
      provider,
      name,
      external_shop_id: externalShopId || null,
      status: "active",
    });

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "Marketplace shop tersebut sudah terdaftar."
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

    if (!editingAccount) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const provider = String(formData.get("provider") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const externalShopId = String(
      formData.get("external_shop_id") ?? "",
    ).trim();
    const status = String(formData.get("status") ?? "active");

    if (!provider || !name) {
      setErrorMessage("Provider dan nama marketplace wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("marketplace_accounts")
      .update({
        provider,
        name,
        external_shop_id: externalShopId || null,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingAccount.id)
      .eq("organization_id", organizationId)
      .select("id")
      .maybeSingle();

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "Marketplace shop tersebut sudah digunakan."
          : error.message,
      );
      setIsSubmitting(false);
      return;
    }

    if (!data) {
      setErrorMessage("Marketplace account tidak ditemukan.");
      setIsSubmitting(false);
      return;
    }

    setEditingId(null);
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleDelete(account: MarketplaceAccount) {
    const confirmed = window.confirm(
      `Hapus marketplace "${account.name}"? Listing, order link, dan sync log account ini juga akan dihapus.`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("marketplace_accounts")
      .delete()
      .eq("id", account.id)
      .eq("organization_id", organizationId)
      .select("id")
      .maybeSingle();

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (!data) {
      setErrorMessage("Marketplace account tidak ditemukan.");
      setIsSubmitting(false);
      return;
    }

    if (editingId === account.id) {
      setEditingId(null);
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Connect Marketplace</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Tambahkan identitas shop atau channel marketplace. Credential API
          tidak disimpan di sini.
        </p>

        <form onSubmit={handleCreate} className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="provider" className="text-sm font-medium">
                Provider
              </label>

              <Input
                id="provider"
                name="provider"
                placeholder="Shopee, Tokopedia, TikTok Shop..."
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Account name
              </label>

              <Input
                id="name"
                name="name"
                placeholder="Contoh: Toko Utama"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="external_shop_id"
                className="text-sm font-medium"
              >
                External Shop ID
              </label>

              <Input
                id="external_shop_id"
                name="external_shop_id"
                placeholder="Optional"
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Add marketplace"}
          </Button>
        </form>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">Marketplace Accounts</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {accounts.length} marketplace account ditemukan.
          </p>
        </div>

        {accounts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium">Belum ada marketplace</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Tambahkan channel marketplace untuk memulai mapping.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3 font-medium">Marketplace</th>
                  <th className="px-6 py-3 font-medium">Provider</th>
                  <th className="px-6 py-3 font-medium">Shop ID</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 font-medium">
                      {account.name}
                    </td>

                    <td className="px-6 py-4">
                      {account.provider}
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">
                      {account.external_shop_id ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                        {account.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/marketplaces/${account.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium hover:bg-muted"
                        >
                          Open
                        </Link>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isSubmitting}
                          onClick={() => {
                            setErrorMessage(null);
                            setEditingId(account.id);
                          }}
                        >
                          Edit
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isSubmitting}
                          onClick={() => handleDelete(account)}
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

      {editingAccount ? (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Edit Marketplace</h2>

          <form onSubmit={handleEdit} className="mt-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Input
                name="provider"
                defaultValue={editingAccount.provider}
                required
              />

              <Input
                name="name"
                defaultValue={editingAccount.name}
                required
              />

              <Input
                name="external_shop_id"
                defaultValue={editingAccount.external_shop_id ?? ""}
              />

              <select
                name="status"
                defaultValue={editingAccount.status}
                className="h-10 rounded-lg border bg-background px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  setErrorMessage(null);
                  setEditingId(null);
                }}
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
