"use client";

import {
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ControlledActionApiRecord } from "@/lib/ai/controlled-action-api";
import { getDictionary } from "@/lib/i18n/dictionaries";

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
  canUseControlledActions: boolean;
};

type ControlledActionResponse = {
  action?: ControlledActionApiRecord;
  error?: string;
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
  canUseControlledActions,
}: Props) {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy =
    getDictionary(locale).products.aiDescription;

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [
    controlledAction,
    setControlledAction,
  ] =
    useState<ControlledActionApiRecord | null>(
      null,
    );

  const [
    controlledGenerationId,
    setControlledGenerationId,
  ] =
    useState<string | null>(null);

  const [
    controlledActionBusy,
    setControlledActionBusy,
  ] =
    useState<
      "propose" | "confirm" | "execute" | null
    >(null);

  const proposalKeys =
    useRef(new Map<string, string>());

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

  async function parseControlledResponse(
    response: Response,
  ) {
    return (
      await response
        .json()
        .catch(() => ({}))
    ) as ControlledActionResponse;
  }

  function proposalKey(
    generationId: string,
  ) {
    const existing =
      proposalKeys.current.get(generationId);

    if (existing) {
      return existing;
    }

    const created =
      `product-description:${generationId}:${crypto.randomUUID()}`;

    proposalKeys.current.set(
      generationId,
      created,
    );

    return created;
  }

  async function handlePrepare(
    generation: Generation,
  ) {
    const proposedDescription =
      generation.generated_description?.trim();

    if (!proposedDescription) {
      setMessage(
        copy.latest.controlledAction.prepareFailed,
      );
      return;
    }

    setMessage(null);
    setControlledActionBusy("propose");

    try {
      const response =
        await fetch(
          "/api/ai/controlled-actions",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              productId:
                product.id,
              expectedDescription:
                product.description,
              proposedDescription,
              idempotencyKey:
                proposalKey(generation.id),
            }),
          },
        );

      const data =
        await parseControlledResponse(
          response,
        );

      if (!response.ok || !data.action) {
        if (
          response.status >= 400 &&
          response.status < 500
        ) {
          proposalKeys.current.delete(
            generation.id,
          );
        }

        setMessage(
          response.status === 409
            ? copy.latest.controlledAction
                .staleMessage
            : copy.latest.controlledAction
                .prepareFailed,
        );
        return;
      }

      proposalKeys.current.delete(
        generation.id,
      );

      setControlledAction(
        data.action,
      );

      setControlledGenerationId(
        generation.id,
      );

      setMessage(
        copy.latest.controlledAction
          .previewReady,
      );
    } catch {
      setMessage(
        copy.latest.controlledAction
          .prepareFailed,
      );
    } finally {
      setControlledActionBusy(null);
    }
  }

  async function handleConfirm() {
    if (
      !controlledAction ||
      controlledAction.status !== "proposed"
    ) {
      return;
    }

    setMessage(null);
    setControlledActionBusy("confirm");

    try {
      const response =
        await fetch(
          `/api/ai/controlled-actions/${controlledAction.id}/confirm`,
          {
            method: "POST",
          },
        );

      const data =
        await parseControlledResponse(
          response,
        );

      if (!response.ok || !data.action) {
        setMessage(
          copy.latest.controlledAction
            .confirmFailed,
        );
        return;
      }

      setControlledAction(data.action);

      setMessage(
        copy.latest.controlledAction
          .confirmedMessage,
      );
    } catch {
      setMessage(
        copy.latest.controlledAction
          .confirmFailed,
      );
    } finally {
      setControlledActionBusy(null);
    }
  }

  async function handleExecute() {
    if (
      !controlledAction ||
      controlledAction.status !== "confirmed"
    ) {
      return;
    }

    setMessage(null);
    setControlledActionBusy("execute");

    try {
      const response =
        await fetch(
          `/api/ai/controlled-actions/${controlledAction.id}/execute`,
          {
            method: "POST",
          },
        );

      const data =
        await parseControlledResponse(
          response,
        );

      if (!response.ok || !data.action) {
        setMessage(
          copy.latest.controlledAction
            .executeFailed,
        );
        return;
      }

      setControlledAction(data.action);

      if (data.action.status === "executed") {
        setMessage(
          copy.latest.controlledAction
            .executedMessage,
        );
        router.refresh();
        return;
      }

      if (data.action.status === "stale") {
        setMessage(
          copy.latest.controlledAction
            .staleMessage,
        );
        router.refresh();
        return;
      }

      if (data.action.status === "failed") {
        setMessage(
          copy.latest.controlledAction
            .executeFailed,
        );
      }
    } catch {
      setMessage(
        copy.latest.controlledAction
          .executeFailed,
      );
    } finally {
      setControlledActionBusy(null);
    }
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
                {latestCompleted.model} â€¢{" "}
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
                !canUseControlledActions ||
                controlledActionBusy !== null ||
                !latestCompleted
                  .generated_description
                  ?.trim()
              }
              onClick={() =>
                handlePrepare(
                  latestCompleted,
                )
              }
            >
              {controlledActionBusy === "propose"
                ? copy.latest.controlledAction
                    .preparing
                : copy.latest.controlledAction
                    .prepare}
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
                "â€”"}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium">
                {copy.latest.seoTitle}
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                {latestCompleted.seo_title ?? "â€”"}
              </p>
            </div>

            <div>
              <div className="text-sm font-medium">
                {copy.latest.metaDescription}
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                {latestCompleted.meta_description ??
                  "â€”"}
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

          {!canUseControlledActions ? (
            <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
              {
                copy.latest.controlledAction
                  .ownerAdminOnly
              }
            </p>
          ) : null}

          {controlledAction &&
          controlledGenerationId ===
            latestCompleted.id ? (
            <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
              <div>
                <h3 className="font-medium">
                  {
                    copy.latest.controlledAction
                      .title
                  }
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {
                    copy.latest.controlledAction
                      .description
                  }
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  {
                    copy.latest.controlledAction
                      .status
                  }
                  {": "}
                  {controlledAction.status}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium">
                    {
                      copy.latest.controlledAction
                        .before
                    }
                  </div>

                  <div className="mt-2 min-h-24 whitespace-pre-wrap rounded-lg border bg-background p-3 text-sm leading-6">
                    {controlledAction
                      .expectedDescription
                      ?.trim() ||
                      copy.current.empty}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">
                    {
                      copy.latest.controlledAction
                        .after
                    }
                  </div>

                  <div className="mt-2 min-h-24 whitespace-pre-wrap rounded-lg border bg-background p-3 text-sm leading-6">
                    {
                      controlledAction
                        .proposedDescription
                    }
                  </div>
                </div>
              </div>

              {controlledAction.status ===
              "proposed" ? (
                <Button
                  type="button"
                  disabled={
                    controlledActionBusy !== null
                  }
                  onClick={handleConfirm}
                >
                  {controlledActionBusy ===
                  "confirm"
                    ? copy.latest
                        .controlledAction
                        .confirming
                    : copy.latest
                        .controlledAction
                        .confirm}
                </Button>
              ) : null}

              {controlledAction.status ===
              "confirmed" ? (
                <Button
                  type="button"
                  disabled={
                    controlledActionBusy !== null
                  }
                  onClick={handleExecute}
                >
                  {controlledActionBusy ===
                  "execute"
                    ? copy.latest
                        .controlledAction
                        .executing
                    : copy.latest
                        .controlledAction
                        .execute}
                </Button>
              ) : null}
            </div>
          ) : null}
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
                          "â€”"}
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
