"use client";

import {
  useState,
} from "react";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import type {
  ActionCenterItem,
} from "@/lib/ai/action-center-contract";
import {
  actionCenterWorkflowOperation,
  actionCenterWorkflowPath,
} from "@/lib/ai/action-center-workflow";
import { getDictionary } from "@/lib/i18n/dictionaries";

type ActionCenterLifecycleActionsProps = {
  item: ActionCenterItem;
  onChanged: () => Promise<void>;
};

function responseErrorMessage(
  body: unknown,
  fallback: string,
) {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (
      body as {
        error?: unknown;
      }
    ).error === "string"
  ) {
    return (
      body as {
        error: string;
      }
    ).error;
  }

  return fallback;
}

function hasActionResponse(
  body: unknown,
) {
  return (
    typeof body === "object" &&
    body !== null &&
    "action" in body &&
    typeof (
      body as {
        action?: unknown;
      }
    ).action === "object" &&
    (
      body as {
        action?: unknown;
      }
    ).action !== null
  );
}

export default function ActionCenterLifecycleActions({
  item,
  onChanged,
}: ActionCenterLifecycleActionsProps) {
  const {
    locale,
  } =
    useLanguage();

  const copy =
    getDictionary(
      locale,
    ).actionCenter.workflow;

  const operation =
    actionCenterWorkflowOperation(
      item.status,
    );

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  if (!operation) {
    return null;
  }

  const isConfirm =
    operation ===
    "confirm";

  async function handleOperation() {
    if (busy) {
      return;
    }

    const endpoint =
      actionCenterWorkflowPath(
        item.id,
        item.status,
      );

    if (!endpoint) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response =
        await fetch(
          endpoint,
          {
            method:
              "POST",

            headers: {
              accept:
                "application/json",
            },
          },
        );

      const body:
        unknown =
        await response
          .json()
          .catch(
            () => null,
          );

      if (!response.ok) {
        throw new Error(
          responseErrorMessage(
            body,
            copy.processFailed,
          ),
        );
      }

      if (
        !hasActionResponse(
          body,
        )
      ) {
        throw new Error(
          copy.invalidResponse,
        );
      }

      await onChanged();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : copy.processFailed,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={
        isConfirm
          ? "rounded-xl border border-amber-200 bg-amber-50 p-4"
          : "rounded-xl border border-blue-200 bg-blue-50 p-4"
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className={
              isConfirm
                ? "text-sm font-semibold text-amber-900"
                : "text-sm font-semibold text-blue-900"
            }
          >
            {isConfirm
              ? copy.reviewTitle
              : copy.readyTitle}
          </p>

          <p
            className={
              isConfirm
                ? "mt-1 max-w-2xl text-xs leading-5 text-amber-800"
                : "mt-1 max-w-2xl text-xs leading-5 text-blue-800"
            }
          >
            {isConfirm
              ? copy.reviewDescription
              : copy.readyDescription}
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void handleOperation();
          }}
          className={
            isConfirm
              ? "inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              : "inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-blue-300 bg-white px-4 text-sm font-semibold text-blue-900 shadow-sm transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          }
        >
          {busy
            ? isConfirm
              ? copy.confirming
              : copy.executing
            : isConfirm
              ? copy.confirm
              : copy.execute}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
    </div>
  );
}
