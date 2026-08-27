import type {
  ControlledPublicationApiRecord,
} from "./controlled-publication-runtime";

import {
  projectControlledPublicationApiRecord,
} from "./controlled-publication-runtime";

export const CONTROLLED_PUBLICATION_API_STATUSES = [
  "proposed",
  "confirmed",
  "stale",
] as const;

export type ControlledPublicationApiStatus =
  (typeof CONTROLLED_PUBLICATION_API_STATUSES)[number];

export type ControlledPublicationListQuery = {
  limit: number;
  offset: number;
  status:
    ControlledPublicationApiStatus | null;
};

type ParseResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: string;
    };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function parseControlledPublicationId(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim().toLowerCase();

  if (!UUID_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function isStatus(
  value: string,
): value is ControlledPublicationApiStatus {
  return (
    CONTROLLED_PUBLICATION_API_STATUSES as readonly string[]
  ).includes(
    value,
  );
}

function parseInteger(
  value: string | null,
  fallback: number,
): number | null {
  if (value === null) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed =
    Number(value);

  if (!Number.isSafeInteger(parsed)) {
    return null;
  }

  return parsed;
}

export function parseControlledPublicationListQuery(
  searchParams: URLSearchParams,
): ParseResult<ControlledPublicationListQuery> {
  const limit =
    parseInteger(
      searchParams.get("limit"),
      20,
    );

  const offset =
    parseInteger(
      searchParams.get("offset"),
      0,
    );

  if (
    limit === null ||
    limit < 1 ||
    limit > 100
  ) {
    return {
      ok: false,
      error:
        "Controlled publication limit tidak valid.",
    };
  }

  if (
    offset === null ||
    offset < 0
  ) {
    return {
      ok: false,
      error:
        "Controlled publication offset tidak valid.",
    };
  }

  const rawStatus =
    searchParams.get("status");

  if (
    rawStatus !== null &&
    rawStatus !== "" &&
    !isStatus(rawStatus)
  ) {
    return {
      ok: false,
      error:
        "Controlled publication status tidak valid.",
    };
  }

  return {
    ok: true,
    value: {
      limit,
      offset,
      status:
        rawStatus &&
        isStatus(rawStatus)
          ? rawStatus
          : null,
    },
  };
}

export function projectControlledPublicationRpcResult(
  value: unknown,
): ControlledPublicationApiRecord | null {
  if (value === null) {
    return null;
  }

  const row =
    Array.isArray(value)
      ? (
          value.length === 1
            ? value[0]
            : null
        )
      : value;

  if (row === null) {
    return null;
  }

  return projectControlledPublicationApiRecord(
    row,
  );
}

export function projectControlledPublicationList(
  value: unknown,
): ControlledPublicationApiRecord[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const publications:
    ControlledPublicationApiRecord[] = [];

  for (const row of value) {
    const publication =
      projectControlledPublicationApiRecord(
        row,
      );

    if (!publication) {
      return null;
    }

    publications.push(
      publication,
    );
  }

  return publications;
}
