"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import ActionCenterLifecycleActions from "@/components/ai/ActionCenterLifecycleActions";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  getDictionary,
  type ActionCenterCopy,
} from "@/lib/i18n/dictionaries";

import type {
  ActionCenterItem,
  ActionCenterLifecycleBucket,
} from "@/lib/ai/action-center-contract";

const PAGE_LIMIT = 20;

type StatusFilter =
  | "all"
  | ActionCenterItem["status"];

type ActionCenterResponse = {
  actions: ActionCenterItem[];
  pagination: {
    limit: number;
    offset: number;
    status:
      ActionCenterItem["status"] | null;
    returned: number;
  };
};

const STATUS_OPTIONS: Array<{
  value: StatusFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "Semua status",
  },
  {
    value: "proposed",
    label: "Proposed",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "executing",
    label: "Executing",
  },
  {
    value: "executed",
    label: "Executed",
  },
  {
    value: "stale",
    label: "Stale",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

const LIFECYCLE_COPY_KEYS:
  Record<
    ActionCenterLifecycleBucket,
    keyof ActionCenterCopy["lifecycle"]
  > = {
    needs_review:
      "needsReview",

    ready_to_execute:
      "readyToExecute",

    in_progress:
      "inProgress",

    completed:
      "completed",

    needs_attention:
      "needsAttention",

    cancelled:
      "cancelled",
  };

function statusOptionLabel(
  copy: ActionCenterCopy,
  status: StatusFilter,
) {
  switch (status) {
    case "all":
      return copy.statuses.all;

    case "proposed":
      return copy.statuses.proposed;

    case "confirmed":
      return copy.statuses.confirmed;

    case "executing":
      return copy.statuses.executing;

    case "executed":
      return copy.statuses.executed;

    case "stale":
      return copy.statuses.stale;

    case "failed":
      return copy.statuses.failed;

    case "cancelled":
      return copy.statuses.cancelled;
  }
}

const LIFECYCLE_TONES:
  Record<
    ActionCenterLifecycleBucket,
    string
  > = {
    needs_review:
      "border-amber-300 bg-amber-50 text-amber-800",

    ready_to_execute:
      "border-blue-300 bg-blue-50 text-blue-800",

    in_progress:
      "border-violet-300 bg-violet-50 text-violet-800",

    completed:
      "border-emerald-300 bg-emerald-50 text-emerald-800",

    needs_attention:
      "border-red-300 bg-red-50 text-red-800",

    cancelled:
      "border-slate-300 bg-slate-100 text-slate-700",
  };

function actionTypeLabel(
  copy: ActionCenterCopy,
  actionType:
    ActionCenterItem["actionType"],
) {
  switch (actionType) {
    case "product.update_description":
      return copy.actionTypes.updateDescription;

    case "product.update_name":
      return copy.actionTypes.updateName;

    case "product.update_status":
      return copy.actionTypes.updateStatus;

    case "product.update_price":
      return copy.actionTypes.updatePrice;
  }
}

function mutationFieldLabel(
  copy: ActionCenterCopy,
  field:
    ActionCenterItem["mutation"]["field"],
) {
  switch (field) {
    case "description":
      return copy.fields.description;

    case "name":
      return copy.fields.name;

    case "status":
      return copy.fields.status;

    case "price":
      return copy.fields.price;
  }
}

function formatMutationValue(
  copy: ActionCenterCopy,
  localeTag: string,
  item: ActionCenterItem,
  value: string | null,
) {
  if (value === null) {
    return copy.values.empty;
  }

  if (
    item.mutation.field === "price"
  ) {
    const numericValue =
      Number(value);

    if (
      Number.isFinite(
        numericValue,
      )
    ) {
      return new Intl.NumberFormat(
        localeTag,
        {
          style:
            "currency",

          currency:
            "IDR",

          maximumFractionDigits:
            2,
        },
      ).format(
        numericValue,
      );
    }
  }

  return value;
}

function formatDate(
  localeTag: string,
  value: string | null,
) {
  if (!value) {
    return "\u2014";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    localeTag,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  ).format(date);
}

function ActionValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
        {value}
      </p>
    </div>
  );
}

function LifecycleBadge({
  copy,
  lifecycle,
}: {
  copy: ActionCenterCopy;
  lifecycle:
    ActionCenterLifecycleBucket;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${LIFECYCLE_TONES[lifecycle]}`}
    >
      {
        copy.lifecycle[
          LIFECYCLE_COPY_KEYS[
            lifecycle
          ]
        ]
      }
    </span>
  );
}

function ActionCard({
  copy,
  item,
  localeTag,
  onChanged,
}: {
  copy: ActionCenterCopy;
  item: ActionCenterItem;
  localeTag: string;
  onChanged: () => Promise<void>;
}) {
  const before =
    formatMutationValue(
      copy,
      localeTag,
      item,
      item.mutation.before,
    );

  const after =
    formatMutationValue(
      copy,
      localeTag,
      item,
      item.mutation.after,
    );

  return (
    <article className="rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <LifecycleBadge
              copy={copy}
              lifecycle={
                item.lifecycleBucket
              }
            />

            <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {statusOptionLabel(copy, item.status)}
            </span>
          </div>

          <h2 className="mt-3 text-base font-semibold">
            {
              actionTypeLabel(
                copy,
                item.actionType,
              )
            }
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {
              mutationFieldLabel(
                copy,
                item.mutation.field,
              )
            }
            {" \u00b7 "}
            {copy.preview.product}
          </p>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xs text-muted-foreground">
            {copy.timeline.created}
          </p>

          <p className="mt-1 text-sm font-medium">
            {
              formatDate(
                localeTag,
                item.timestamps
                  .createdAt,
              )
            }
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <p className="mb-3 text-sm font-semibold">
            {copy.preview.title}
          </p>

          <div className="grid gap-3 lg:grid-cols-2">
            <ActionValue
              label={copy.preview.before}
              value={before}
            />

            <ActionValue
              label={copy.preview.after}
              value={after}
            />
          </div>
        </div>

        <ActionCenterLifecycleActions
          item={item}
          onChanged={onChanged}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">
              {copy.timeline.confirmed}
            </p>

            <p className="mt-1 text-sm">
              {
                formatDate(
                  localeTag,
                  item.timestamps
                    .confirmedAt,
                )
              }
            </p>
          </div>

          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">
              {copy.timeline.executionStarted}
            </p>

            <p className="mt-1 text-sm">
              {
                formatDate(
                  localeTag,
                  item.timestamps
                    .executionStartedAt,
                )
              }
            </p>
          </div>

          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">
              {copy.timeline.finalized}
            </p>

            <p className="mt-1 text-sm">
              {
                formatDate(
                  localeTag,
                  item.timestamps
                    .finalizedAt,
                )
              }
            </p>
          </div>

          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">
              {copy.timeline.contract}
            </p>

            <p className="mt-1 text-sm">
              v{item.contractVersion}
            </p>
          </div>
        </div>

        {item.errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              {copy.metadata.error}
            </p>

            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-red-800">
              {item.errorMessage}
            </p>
          </div>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.metadata.risk}
            </p>

            <p className="mt-2 text-sm">
              {item.risk ?? copy.values.unavailable}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.metadata.rationale}
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              {item.rationale ?? copy.values.rationaleUnavailable}
            </p>
          </div>
        </div>

        <details className="rounded-xl border bg-muted/20 p-4">
          <summary className="cursor-pointer text-sm font-medium">
            {copy.metadata.auditDetail}
          </summary>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">
                {copy.metadata.actionId}
              </dt>

              <dd className="mt-1 break-all font-mono text-xs">
                {item.id}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground">
                {copy.metadata.targetId}
              </dt>

              <dd className="mt-1 break-all font-mono text-xs">
                {item.target.id}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground">
                {copy.metadata.actionType}
              </dt>

              <dd className="mt-1 break-all font-mono text-xs">
                {item.actionType}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground">
                {copy.metadata.field}
              </dt>

              <dd className="mt-1 break-all font-mono text-xs">
                {item.mutation.field}
              </dd>
            </div>
          </dl>
        </details>
      </div>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export default function ActionCenterWorkspace() {
  const {
    locale,
  } =
    useLanguage();

  const copy =
    getDictionary(
      locale,
    ).actionCenter;

  const localeTag =
    locale === "id"
      ? "id-ID"
      : "en-US";

  const [
    actions,
    setActions,
  ] =
    useState<
      ActionCenterItem[]
    >([]);

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all",
    );

  const [
    offset,
    setOffset,
  ] =
    useState(0);

  const [
    returned,
    setReturned,
  ] =
    useState(0);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const loadActions =
    useCallback(
      async (
        signal?:
          AbortSignal,
      ) => {
        setLoading(true);
        setError(null);

        try {
          const query =
            new URLSearchParams({
              limit:
                String(
                  PAGE_LIMIT,
                ),

              offset:
                String(
                  offset,
                ),
            });

          if (
            statusFilter !==
            "all"
          ) {
            query.set(
              "status",
              statusFilter,
            );
          }

          const response =
            await fetch(
              `/api/ai/controlled-actions?${query.toString()}`,
              {
                method:
                  "GET",

                cache:
                  "no-store",

                signal,
              },
            );

          const body:
            unknown =
            await response
              .json()
              .catch(
                () => null,
              );

          if (
            !response.ok
          ) {
            const message =
              typeof body ===
                "object" &&
              body !== null &&
              "error" in body &&
              typeof (
                body as {
                  error?: unknown;
                }
              ).error ===
                "string"
                ? (
                    body as {
                      error: string;
                    }
                  ).error
                : copy.messages.loadFailed;

            throw new Error(
              message,
            );
          }

          if (
            typeof body !==
              "object" ||
            body === null ||
            !(
              "actions" in
              body
            ) ||
            !Array.isArray(
              (
                body as {
                  actions?: unknown;
                }
              ).actions,
            ) ||
            !(
              "pagination" in
              body
            )
          ) {
            throw new Error(
              copy.messages.invalidResponse,
            );
          }

          const data =
            body as
              ActionCenterResponse;

          setActions(
            data.actions,
          );

          setReturned(
            data.pagination
              .returned,
          );
        } catch (
          caughtError
        ) {
          if (
            caughtError instanceof
              DOMException &&
            caughtError.name ===
              "AbortError"
          ) {
            return;
          }

          setActions([]);
          setReturned(0);

          setError(
            caughtError instanceof
              Error
              ? caughtError.message
              : copy.messages.loadFailed,
          );
        } finally {
          if (
            !signal?.aborted
          ) {
            setLoading(false);
          }
        }
      },
      [
        offset,
        statusFilter,
      ],
    );

  useEffect(
    () => {
      const controller =
        new AbortController();

      const timeoutId =
        window.setTimeout(
          () => {
            void loadActions(
              controller.signal,
            );
          },
          0,
        );

      return () => {
        window.clearTimeout(
          timeoutId,
        );

        controller.abort();
      };
    },
    [
      loadActions,
    ],
  );

  const summary =
    useMemo(
      () => ({
        review:
          actions.filter(
            (item) =>
              item.lifecycleBucket ===
              "needs_review",
          ).length,

        ready:
          actions.filter(
            (item) =>
              item.lifecycleBucket ===
              "ready_to_execute",
          ).length,

        attention:
          actions.filter(
            (item) =>
              item.lifecycleBucket ===
              "needs_attention",
          ).length,

        completed:
          actions.filter(
            (item) =>
              item.lifecycleBucket ===
              "completed",
          ).length,
      }),
      [actions],
    );

  const currentPage =
    Math.floor(
      offset /
        PAGE_LIMIT,
    ) + 1;

  const canGoNext =
    returned ===
    PAGE_LIMIT;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {copy.header.title}
            </h1>

            <span className="inline-flex rounded-full border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {copy.header.badge}
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {copy.header.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadActions();
          }}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-xl border bg-card px-4 text-sm font-medium shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Memuat..."
            : "Refresh"}
        </button>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        {copy.header.notice}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={copy.summary.needsReview}
          value={summary.review}
          description={copy.summary.needsReviewDescription}
        />

        <SummaryCard
          label={copy.summary.ready}
          value={summary.ready}
          description={copy.summary.readyDescription}
        />

        <SummaryCard
          label={copy.summary.attention}
          value={
            summary.attention
          }
          description={copy.summary.attentionDescription}
        />

        <SummaryCard
          label={copy.summary.completed}
          value={
            summary.completed
          }
          description={copy.summary.completedDescription}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label
            htmlFor="action-center-status"
            className="text-sm font-medium"
          >
            {copy.filter.label}
          </label>

          <p className="mt-1 text-xs text-muted-foreground">
            {copy.filter.description}
          </p>
        </div>

        <select
          id="action-center-status"
          value={statusFilter}
          onChange={(
            event,
          ) => {
            setOffset(0);

            setStatusFilter(
              event.target
                .value as
                StatusFilter,
            );
          }}
          className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        >
          {STATUS_OPTIONS.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {
                  statusOptionLabel(
                    copy,
                    option.value,
                  )
                }
              </option>
            ),
          )}
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-800">
            {copy.messages.loadFailedTitle}
          </p>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              void loadActions();
            }}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-800"
          >
            {copy.messages.retry}
          </button>
        </div>
      ) : null}

      {loading &&
      actions.length === 0 ? (
        <div className="space-y-3">
          {Array.from({
            length: 3,
          }).map(
            (
              _,
              index,
            ) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-2xl border bg-muted/40"
              />
            ),
          )}
        </div>
      ) : null}

      {!loading &&
      !error &&
      actions.length === 0 ? (
        <div className="rounded-2xl border bg-card px-6 py-14 text-center shadow-sm">
          <p className="font-semibold">
            {copy.messages.emptyTitle}
          </p>

          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Tidak ada action yang cocok
            dengan filter dan halaman
            saat ini.
          </p>
        </div>
      ) : null}

      {actions.length > 0 ? (
        <div className="space-y-4">
          {actions.map(
            (item) => (
              <ActionCard
                key={item.id}
                copy={copy}
                item={item}
                localeTag={localeTag}
                onChanged={() =>
                  loadActions()
                }
              />
            ),
          )}
        </div>
      ) : null}

      {!error &&
      (actions.length > 0 ||
        offset > 0) ? (
        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            {copy.pagination.page}{" "}
            {currentPage}
            {" \u00b7 "}
            {returned} action
            ditampilkan
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={
                loading ||
                offset === 0
              }
              onClick={() => {
                setOffset(
                  Math.max(
                    0,
                    offset -
                      PAGE_LIMIT,
                  ),
                );
              }}
              className="inline-flex h-9 items-center justify-center rounded-lg border px-3 font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copy.pagination.previous}
            </button>

            <button
              type="button"
              disabled={
                loading ||
                !canGoNext
              }
              onClick={() => {
                setOffset(
                  offset +
                    PAGE_LIMIT,
                );
              }}
              className="inline-flex h-9 items-center justify-center rounded-lg border px-3 font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copy.pagination.next}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
