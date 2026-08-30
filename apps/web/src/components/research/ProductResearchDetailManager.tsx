"use client";

import { useState, type FormEvent } from "react";
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

type Observation = {
  id: string;
  source_name: string;
  source_url: string | null;
  observed_price: number | string | null;
  sold_count: number | null;
  rating: number | string | null;
  review_count: number | null;
  notes: string | null;
  observed_at: string;
  created_at: string;
};

type Props = {
  organizationId: string;
  item: ResearchItem;
  products: Product[];
  observations: Observation[];
};

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const number = Number(text);

  return Number.isFinite(number) ? number : null;
}

function optionalInteger(value: FormDataEntryValue | null) {
  const number = optionalNumber(value);

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

function formatDate(
  value: string,
  locale: "id" | "en",
) {
  return new Intl.DateTimeFormat(
    locale === "id" ? "id-ID" : "en-US",
    {
    dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

export default function ProductResearchDetailManager({
  organizationId,
  item,
  products,
  observations,
}: Props) {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy = getProductResearchCopy(locale);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function updateStatus(status: string) {
    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("product_research_items")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("organization_id", organizationId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      setErrorMessage(
        error?.message ?? copy.detail.candidateNotFound,
      );
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      setErrorMessage(copy.detail.candidateNameRequired);
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("product_research_items")
      .update({
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
        observed_price: optionalNumber(
          formData.get("observed_price"),
        ),
        estimated_cost: optionalNumber(
          formData.get("estimated_cost"),
        ),
        demand_score: optionalInteger(
          formData.get("demand_score"),
        ),
        competition_score: optionalInteger(
          formData.get("competition_score"),
        ),
        opportunity_score: optionalInteger(
          formData.get("opportunity_score"),
        ),
        status: String(formData.get("status") ?? item.status),
        notes:
          String(formData.get("notes") ?? "").trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("organization_id", organizationId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      setErrorMessage(
        error?.message ?? copy.detail.candidateNotFound,
      );
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  async function handleDeleteCandidate() {
    if (!window.confirm(`${copy.detail.deleteCandidateConfirmPrefix} "${item.name}"?`)) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("product_research_items")
      .delete()
      .eq("id", item.id)
      .eq("organization_id", organizationId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      setErrorMessage(
        error?.message ?? copy.detail.candidateNotFound,
      );
      setIsSubmitting(false);
      return;
    }

    router.push("/research");
    router.refresh();
  }

  async function handleAddObservation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const sourceName = String(
      formData.get("source_name") ?? "",
    ).trim();

    if (!sourceName) {
      setErrorMessage(copy.detail.observationSourceRequired);
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("product_research_observations")
      .insert({
        organization_id: organizationId,
        research_item_id: item.id,
        source_name: sourceName,
        source_url:
          String(formData.get("source_url") ?? "").trim() || null,
        observed_price: optionalNumber(
          formData.get("observed_price"),
        ),
        sold_count: optionalInteger(formData.get("sold_count")),
        rating: optionalNumber(formData.get("rating")),
        review_count: optionalInteger(
          formData.get("review_count"),
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

  async function deleteObservation(observation: Observation) {
    if (!window.confirm(copy.detail.deleteObservationConfirm)) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("product_research_observations")
      .delete()
      .eq("id", observation.id)
      .eq("organization_id", organizationId)
      .eq("research_item_id", item.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      setErrorMessage(
        error?.message ?? copy.detail.observationNotFound,
      );
      setIsSubmitting(false);
      return;
    }

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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">
            {copy.detail.demandScore}
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {item.demand_score ?? "—"}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">
            {copy.detail.competitionScore}
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {item.competition_score ?? "—"}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">
            {copy.detail.opportunityScore}
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {item.opportunity_score ?? "—"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => updateStatus("researching")}
          >
            {copy.detail.researching}
          </Button>

          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => updateStatus("shortlisted")}
          >
            {copy.detail.shortlist}
          </Button>

          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => updateStatus("approved")}
          >
            {copy.detail.approve}
          </Button>

          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => updateStatus("rejected")}
          >
            {copy.detail.reject}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{copy.detail.profileTitle}</h2>

        <form onSubmit={handleUpdate} className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input name="name" defaultValue={item.name} required />

            <Input
              name="category"
              defaultValue={item.category ?? ""}
              placeholder={copy.manager.category}
            />

            <Input
              name="source_marketplace"
              defaultValue={item.source_marketplace ?? ""}
              placeholder={copy.manager.sourceMarketplace}
            />

            <Input
              name="source_url"
              type="url"
              defaultValue={item.source_url ?? ""}
              placeholder={copy.manager.sourceUrl}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              name="observed_price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={item.observed_price ?? ""}
              placeholder={copy.manager.observedPrice}
            />

            <Input
              name="estimated_cost"
              type="number"
              min="0"
              step="0.01"
              defaultValue={item.estimated_cost ?? ""}
              placeholder={copy.manager.estimatedCost}
            />

            <select
              name="linked_product_id"
              defaultValue={item.linked_product_id ?? ""}
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
              defaultValue={getProductResearchStatusLabel(locale, item.status)}
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
              defaultValue={item.demand_score ?? ""}
              placeholder={copy.manager.demandScore}
            />

            <Input
              name="competition_score"
              type="number"
              min="0"
              max="100"
              defaultValue={item.competition_score ?? ""}
              placeholder={copy.manager.competitionScore}
            />

            <Input
              name="opportunity_score"
              type="number"
              min="0"
              max="100"
              defaultValue={item.opportunity_score ?? ""}
              placeholder={copy.manager.opportunityScore}
            />
          </div>

          <textarea
            name="notes"
            rows={4}
            defaultValue={item.notes ?? ""}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder={copy.manager.researchNotes}
          />

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {copy.detail.saveResearch}
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={handleDeleteCandidate}
            >
              {copy.detail.deleteCandidate}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {copy.detail.addObservation}
        </h2>

        <form
          onSubmit={handleAddObservation}
          className="mt-5 space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              name="source_name"
              placeholder={copy.detail.sourceName}
              required
            />

            <Input
              name="source_url"
              type="url"
              placeholder={copy.manager.sourceUrl}
            />

            <Input
              name="observed_price"
              type="number"
              min="0"
              step="0.01"
              placeholder={copy.manager.observedPrice}
            />

            <Input
              name="sold_count"
              type="number"
              min="0"
              placeholder={copy.detail.soldCount}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              name="rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder={copy.detail.rating}
            />

            <Input
              name="review_count"
              type="number"
              min="0"
              placeholder={copy.detail.reviewCount}
            />

            <Input
              name="notes"
              placeholder={copy.detail.observationNote}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {copy.detail.addObservationAction}
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">
            Observation History
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {observations.length} market observations.
          </p>
        </div>

        {observations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            Belum ada observation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">{copy.manager.source}</th>
                  <th className="px-6 py-3">{copy.manager.price}</th>
                  <th className="px-6 py-3">{copy.detail.soldCount}</th>
                  <th className="px-6 py-3">{copy.detail.rating}</th>
                  <th className="px-6 py-3">{copy.detail.reviewCount}</th>
                  <th className="px-6 py-3">{copy.manager.action}</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {observations.map((observation) => (
                  <tr key={observation.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      {formatDate(observation.observed_at, locale)}
                    </td>

                    <td className="px-6 py-4">
                      {observation.source_name}
                    </td>

                    <td className="px-6 py-4">
                      {formatCurrency(observation.observed_price, locale)}
                    </td>

                    <td className="px-6 py-4">
                      {observation.sold_count ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      {observation.rating ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      {observation.review_count ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isSubmitting}
                        onClick={() =>
                          deleteObservation(observation)
                        }
                      >
                        {copy.detail.delete}
                      </Button>
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
