import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";

import { logServerError } from "./lib/observability/server-logger";

function headerValue(
  headers: Record<
    string,
    string | string[] | undefined
  >,
  name: string,
) {
  const normalizedName =
    name.toLowerCase();

  const matchingKey =
    Object.keys(headers).find(
      (key) =>
        key.toLowerCase() ===
        normalizedName,
    );

  if (!matchingKey) {
    return null;
  }

  const value =
    headers[matchingKey];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function errorDigest(
  error: unknown,
) {
  if (
    typeof error !== "object" ||
    error === null ||
    !("digest" in error)
  ) {
    return null;
  }

  const digest = error.digest;

  return typeof digest === "string"
    ? digest
    : null;
}

export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs"
  ) {
    await import(
      "../sentry.server.config"
    );
  }

  if (
    process.env.NEXT_RUNTIME === "edge"
  ) {
    await import(
      "../sentry.edge.config"
    );
  }
}

export const onRequestError:
  Instrumentation.onRequestError = async (
    error,
    request,
    context,
  ) => {
    logServerError({
      event: "next_request_error",
      requestId: headerValue(
        request.headers,
        "x-request-id",
      ),
      route: context.routePath,
      method: request.method,
      operation:
        "next_server_request",
      errorDigest:
        errorDigest(error),
      routerKind:
        context.routerKind,
      routeType:
        context.routeType,
      runtime:
        process.env.NEXT_RUNTIME ??
        null,
      error,
    });

    Sentry.captureRequestError(
      error,
      request,
      context,
    );
  };
