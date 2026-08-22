import type {
  TodayMarketplaceChannel,
} from "./today-contract";

type CanonicalNumeric =
  | number
  | string
  | null
  | undefined;

export type TodayMarketplaceHealthAccountInput = {
  status:
    string;

  last_synced_at:
    string | null;

  recent_failed_sync_count?:
    CanonicalNumeric;
};

export type BuildTodayMarketplaceChannelHealthInput = {
  account:
    TodayMarketplaceHealthAccountInput;

  generatedAt:
    string;

  maxAgeHours:
    number;
};

function numericValue(
  value:
    CanonicalNumeric,
): number | null {
  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value,
    )
      ? value
      : null;
  }

  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  if (
    normalized.length === 0
  ) {
    return null;
  }

  const parsed =
    Number(
      normalized,
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
}

export function buildTodayMarketplaceChannelHealth({
  account,
  generatedAt,
  maxAgeHours,
}: BuildTodayMarketplaceChannelHealthInput): Pick<
  TodayMarketplaceChannel,
  "health" | "reasons"
> {
  const reasons:
    string[] = [];

  if (
    account.status !==
    "active"
  ) {
    reasons.push(
      "marketplace_account_not_active",
    );
  }

  const failedSyncCount =
    numericValue(
      account.recent_failed_sync_count,
    );

  if (
    failedSyncCount !== null &&
    failedSyncCount > 0
  ) {
    reasons.push(
      "recent_sync_failures",
    );
  }

  if (
    account.last_synced_at ===
    null
  ) {
    reasons.push(
      "never_synced",
    );

    return {
      health:
        "attention",

      reasons,
    };
  }

  const generatedAtMs =
    Date.parse(
      generatedAt,
    );

  const lastSyncedAtMs =
    Date.parse(
      account.last_synced_at,
    );

  if (
    !Number.isFinite(
      generatedAtMs,
    ) ||
    !Number.isFinite(
      lastSyncedAtMs,
    )
  ) {
    return {
      health:
        "unavailable",

      reasons: [
        ...reasons,
        "sync_timestamp_unavailable",
      ],
    };
  }

  const ageHours =
    Math.max(
      0,
      generatedAtMs -
        lastSyncedAtMs,
    ) /
    3_600_000;

  if (
    ageHours >
    maxAgeHours
  ) {
    reasons.push(
      "sync_stale",
    );
  }

  return {
    health:
      reasons.length === 0
        ? "healthy"
        : "attention",

    reasons,
  };
}