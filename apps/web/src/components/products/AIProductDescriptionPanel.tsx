"use client";

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
  description: string | null;
  status: string;
};

type Generation = {
  id: string;
  provider: string;
  model: string;
  status: string;

  tone: string;
  language: string;
  target_audience: string | null;

  generated_description: string | null;
  short_description: string | null;
  seo_title: string | null;
  meta_description: string | null;

  keywords: unknown;

  error_message: string | null;

  created_at: string;
  completed_at: string | null;
};

type Props = {
  product: Product;
  generations: Generation[];
};

function stringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}

function formatDate(value: string, locale: "id" | "en") {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AIProductDescriptionPanel({
  product,
  generations,
}: Props) {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy =
    getDictionary(locale).products.aiDescription;

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [applyingId, setApplyingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const latestCompleted =
    generations.find(
      (generation) =>
        generation.status === "completed",
    ) ?? null;

  function localizeGenerationError(
    error?: string,
  ) {
    switch (error) {
      case "Organization aktif tidak ditemukan.":
        return copy.messages.noOrganization;

      case "Authentication required.":
        return copy.messages.authenticationRequired;

      case "Tone terlalu panjang.":
        return copy.messages.toneTooLong;

      case "Language terlalu panjang.":
        return copy.messages.languageTooLong;

      case "Target audience terlalu panjang.":
        return copy.messages.targetAudienceTooLong;

      case "Instructions terlalu panjang.":
        return copy.messages.instructionsTooLong;

      case "Product tidak ditemukan.":
        return copy.messages.productNotFound;

      case "Description generation tidak dapat dibuat.":
        return copy.messages.generationUnavailable;

      default:
        return copy.messages.generationFailed;
    }
  }
  async function handleGenerate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);
    setIsGenerating(true);

    const formData =
      new FormData(event.currentTarget);

    try {
      const response = await fetch(
        `/api/products/${product.id}/description`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            tone:
              String(
                formData.get("tone") ?? "",
              ),

            language:
              String(
                formData.get("language") ?? "",
              ),

            targetAudience:
              String(
                formData.get(
                  "target_audience",
                ) ?? "",
              ),

            instructions:
              String(
                formData.get("instructions") ?? "",
              ),
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          localizeGenerationError(data.error),
        );
      }

      setMessage(
        copy.messages.generated,
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : copy.messages.generationFailed,
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleApply(
    generationId: string,
  ) {
    setMessage(null);
    setApplyingId(generationId);

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "apply_product_description_generation",
      {
        p_generation_id: generationId,
      },
    );

    if (error) {
      setMessage(copy.messages.applyFailed);
      setApplyingId(null);
      return;
    }

    setMessage(
      copy.messages.applied,
    );

    setApplyingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {copy.current.title}
        </h2>

        <div className="mt-4 whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-sm leading-6">
          {product.description?.trim() ||
            copy.current.empty}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {copy.generator.title}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {copy.generator.description}
        </p>

        <form
          onSubmit={handleGenerate}
          className="mt-5 space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <select
              name="tone"
              defaultValue="professional"
              className="h-10 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="professional">
                {copy.generator.form.tones.professional}
              </option>
              <option value="friendly">
                {copy.generator.form.tones.friendly}
              </option>
              <option value="premium">
                Premium
              </option>
              <option value="concise">
                Concise
              </option>
              <option value="persuasive">
                Persuasive
              </option>
            </select>

            <Input
              name="language"
              defaultValue={copy.generator.form.defaultLanguage}
              placeholder={copy.generator.form.languagePlaceholder}
            />

            <Input
              name="target_audience"
              placeholder={copy.generator.form.targetAudiencePlaceholder}
            />
          </div>

          <textarea
            name="instructions"
            rows={4}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder={copy.generator.form.instructionsPlaceholder}
          />

          <Button
            type="submit"
            disabled={isGenerating}
          >
            {isGenerating
              ? copy.generator.generating
              : copy.generator.generate}
          </Button>
        </form>

        {message ? (
          <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            {message}
          </div>
        ) : null}
      </div>

      {latestCompleted ? (
        <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {copy.latest.title}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {latestCompleted.model} •{" "}
                {formatDate(
                  latestCompleted.created_at,
                  locale,
                )}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={
                applyingId === latestCompleted.id
              }
              onClick={() =>
                handleApply(latestCompleted.id)
              }
            >
              {applyingId === latestCompleted.id
                ? copy.latest.applying
                : copy.latest.apply}
            </Button>
          </div>

          <div>
            <div className="text-sm font-medium">
              {copy.latest.productDescription}
            </div>

            <div className="mt-2 whitespace-pre-wrap rounded-xl border p-4 text-sm leading-6">
              {latestCompleted.generated_description}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">
              {copy.latest.shortDescription}
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {latestCompleted.short_description ??
                "—"}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium">
                {copy.latest.seoTitle}
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                {latestCompleted.seo_title ?? "—"}
              </p>
            </div>

            <div>
              <div className="text-sm font-medium">
                {copy.latest.metaDescription}
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                {latestCompleted.meta_description ??
                  "—"}
              </p>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">
              {copy.latest.keywords}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {stringArray(
                latestCompleted.keywords,
              ).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border px-3 py-1 text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {copy.latest.applyNote}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card px-6 py-10 text-center shadow-sm">
          <p className="font-medium">
            {copy.latest.empty}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">
            {copy.history.title}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {generations.length} generation run.
          </p>
        </div>

        {generations.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            {copy.history.empty}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">{copy.history.model}</th>
                  <th className="px-6 py-3">{copy.history.tone}</th>
                  <th className="px-6 py-3">{copy.history.language}</th>
                  <th className="px-6 py-3">{copy.history.status}</th>
                  <th className="px-6 py-3">{copy.history.error}</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {generations.map(
                  (generation) => (
                    <tr key={generation.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        {formatDate(
                          generation.created_at,
                          locale,
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {generation.model}
                      </td>

                      <td className="px-6 py-4 capitalize">
                        {generation.tone}
                      </td>

                      <td className="px-6 py-4">
                        {generation.language}
                      </td>

                      <td className="px-6 py-4 capitalize">
                        {generation.status}
                      </td>

                      <td className="max-w-xs px-6 py-4 text-muted-foreground">
                        {generation.error_message ??
                          "—"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
