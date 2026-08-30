"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import {
  getProductResearchCopy,
  getProductResearchStatusLabel,
} from "@/lib/i18n/product-research";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type ResearchItem = {
  id: string;
  linked_product_id: string | null;
  name: string;
  category: string | null;
  source_marketplace: string | null;
  source_url: string | null;
  observed_price: number | string | null;
  estimated_cost: number | string | null;
  demand_score: number | null;
  competition_score: number | null;
  opportunity_score: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  status: string;
};

type Props = {
  organizationId: string;
  items: ResearchItem[];
  products: Product[];
};

function nullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const number = Number(text);

  return Number.isFinite(number) ? number : null;
}

function nullableInteger(value: FormDataEntryValue | null) {
  const number = nullableNumber(value);

  return number === null ? null : Math.round(number);
}

function formatCurrency(
  value: number | string | null,
  locale: "id" | "en",
) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat(
    locale === "id" ? "id-ID" : "en-US",
    {
    style: "currency",
    currency: "IDR",
      maximumFractionDigits: 0,
    },
  ).format(Number(value));
}

export default function ProductResearchManager({
  organizationId,
  items,
  products,
}: Props) {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy = getProductResearchCopy(locale);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.category?.toLowerCase().includes(keyword) ||
        item.source_marketplace?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      setErrorMessage(copy.manager.nameRequired);
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("product_research_items")
      .insert({
        organization_id: organizationId,
        linked_product_id:
          String(formData.get("linked_product_id") ?? "") || null,
        name,
        category:
          String(formData.get("category") ?? "").trim() || null,
        source_marketplace:
          String(formData.get("source_marketplace") ?? "").trim() ||
          null,
        source_url:
          String(formData.get("source_url") ?? "").trim() || null,
        observed_price: nullableNumber(
          formData.get("observed_price"),
        ),
        estimated_cost: nullableNumber(
          formData.get("estimated_cost"),
        ),
        demand_score: nullableInteger(
          formData.get("demand_score"),
        ),
        competition_score: nullableInteger(
          formData.get("competition_score"),
        ),
        opportunity_score: nullableInteger(
          formData.get("opportunity_score"),
        ),
        status: String(
          formData.get("status") ?? "researching",
        ),
        notes:
          String(formData.get("notes") ?? "").trim() || null,
      });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    form.reset();
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {copy.manager.addTitle}
        </h2>

        <form onSubmit={handleCreate} className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input name="name" placeholder={copy.manager.productCandidate} required />

            <Input name="category" placeholder={copy.manager.category} />

            <Input
              name="source_marketplace"
              placeholder={copy.manager.marketplaceSource}
            />

            <Input
              name="source_url"
              type="url"
              placeholder={copy.manager.sourceUrl}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              name="observed_price"
              type="number"
              min="0"
              step="0.01"
              placeholder={copy.manager.observedPrice}
            />

            <Input
              name="estimated_cost"
              type="number"
              min="0"
              step="0.01"
              placeholder={copy.manager.estimatedCost}
            />

            <select
              name="linked_product_id"
              defaultValue=""
              className="h-10 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">{copy.manager.noLinkedProduct}</option>

              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                  {product.sku ? ` (${product.sku})` : ""}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue="researching"
              className="h-10 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="researching">{copy.statuses.researching}</option>
              <option value="shortlisted">{copy.statuses.shortlisted}</option>
              <option value="approved">{copy.statuses.approved}</option>
              <option value="rejected">{copy.statuses.rejected}</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              name="demand_score"
              type="number"
              min="0"
              max="100"
              placeholder={`${copy.manager.demandScore} 0-100`}
            />

            <Input
              name="competition_score"
              type="number"
              min="0"
              max="100"
              placeholder={`${copy.manager.competitionScore} 0-100`}
            />

            <Input
              name="opportunity_score"
              type="number"
              min="0"
              max="100"
              placeholder={`${copy.manager.opportunityScore} 0-100`}
            />
          </div>

          <textarea
            name="notes"
            rows={3}
            placeholder={copy.manager.researchNotes}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? copy.manager.saving : copy.manager.addCandidate}
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.manager.search}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="all">{copy.manager.allStatus}</option>
            <option value="researching">{copy.statuses.researching}</option>
            <option value="shortlisted">{copy.statuses.shortlisted}</option>
            <option value="approved">{copy.statuses.approved}</option>
            <option value="rejected">{copy.statuses.rejected}</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">
            {copy.manager.candidatesTitle}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {filteredItems.length} dari {items.length} kandidat.
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium">
              {copy.manager.empty}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3">{copy.manager.candidate}</th>
                  <th className="px-6 py-3">{copy.manager.source}</th>
                  <th className="px-6 py-3">{copy.manager.price}</th>
                  <th className="px-6 py-3">{copy.manager.demand}</th>
                  <th className="px-6 py-3">{copy.manager.competition}</th>
                  <th className="px-6 py-3">{copy.manager.opportunity}</th>
                  <th className="px-6 py-3">{copy.manager.status}</th>
                  <th className="px-6 py-3">{copy.manager.action}</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.category ?? copy.manager.uncategorized}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {item.source_marketplace ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      {formatCurrency(item.observed_price, locale)}
                    </td>

                    <td className="px-6 py-4">
                      {item.demand_score ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      {item.competition_score ?? "—"}
                    </td>

                    <td className="px-6 py-4 font-semibold">
                      {item.opportunity_score ?? "—"}
                    </td>

                    <td className="px-6 py-4 capitalize">
                      {getProductResearchStatusLabel(locale, item.status)}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/research/${item.id}`}
                        className="inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium hover:bg-muted"
                      >
                        {copy.manager.open}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
