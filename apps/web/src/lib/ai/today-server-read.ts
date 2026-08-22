import {
  getCurrentOrganization,
} from "@/lib/supabase/current-organization";
import {
  createClient,
} from "@/lib/supabase/server";

import type {
  LakuvoTodaySnapshot,
} from "./today-contract";
import {
  buildLakuvoTodayReadModel,
  type TodayInventoryIntelligenceInput,
  type TodayMarketplaceAccountInput,
  type TodaySalesSummaryInput,
} from "./today-read-model";

export const TODAY_RECENT_SYNC_FAILURE_HOURS =
  24 as const;

type MarketplaceSyncLogRow = {
  marketplace_account_id:
    string;

  status:
    string | null;

  created_at:
    string;
};

export function todaySyncFailureWindowStart(
  generatedAt:
    string,
  hours: number =
    TODAY_RECENT_SYNC_FAILURE_HOURS,
): string {
  const generatedAtMs =
    Date.parse(
      generatedAt,
    );

  if (
    !Number.isFinite(
      generatedAtMs,
    )
  ) {
    throw new Error(
      "Invalid TODAY generatedAt timestamp.",
    );
  }

  const normalizedHours =
    Number.isFinite(
      hours,
    ) &&
    hours > 0
      ? hours
      : TODAY_RECENT_SYNC_FAILURE_HOURS;

  return new Date(
    generatedAtMs -
      normalizedHours *
        3_600_000,
  ).toISOString();
}

export function countRecentMarketplaceFailures(
  logs:
    readonly MarketplaceSyncLogRow[],
): Map<string, number> {
  const counts =
    new Map<
      string,
      number
    >();

  for (
    const log
    of logs
  ) {
    /*
     * Deliberately conservative.
     *
     * TODAY only treats the explicit "failed"
     * status as a failed synchronization.
     * Unknown or future statuses are not
     * inferred to be failures.
     */
    if (
      log.status
        ?.trim()
        .toLowerCase() !==
      "failed"
    ) {
      continue;
    }

    counts.set(
      log.marketplace_account_id,
      (
        counts.get(
          log.marketplace_account_id,
        ) ?? 0
      ) + 1,
    );
  }

  return counts;
}

export type LoadLakuvoTodayFromServerOptions = {
  generatedAt?:
    string;

  marketplaceSyncFailureHours?:
    number;
};

export async function loadLakuvoTodayFromServer(
  options:
    LoadLakuvoTodayFromServerOptions = {},
): Promise<
  LakuvoTodaySnapshot | null
> {
  const currentOrganization =
    await getCurrentOrganization();

  if (
    !currentOrganization
  ) {
    return null;
  }

  const organizationId =
    currentOrganization.organizationId;

  const generatedAt =
    options.generatedAt ??
    new Date().toISOString();

  const failureWindowStart =
    todaySyncFailureWindowStart(
      generatedAt,
      options.marketplaceSyncFailureHours,
    );

  const supabase =
    await createClient();

  const [
    salesResult,
    inventoryResult,
    alertsResult,
    accountsResult,
    syncLogsResult,
  ] =
    await Promise.all([
      supabase.rpc(
        "get_sales_performance_summary",
        {
          p_organization_id:
            organizationId,
        },
      ),

      supabase.rpc(
        "get_inventory_intelligence",
        {
          p_organization_id:
            organizationId,
        },
      ),

      supabase.rpc(
        "get_inventory_alerts",
        {
          p_organization_id:
            organizationId,

          p_limit:
            50,
        },
      ),

      supabase
        .from(
          "marketplace_accounts",
        )
        .select(
          "id, provider, name, status, last_synced_at",
        )
        .eq(
          "organization_id",
          organizationId,
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        ),

      supabase
        .from(
          "marketplace_sync_logs",
        )
        .select(
          "marketplace_account_id, status, created_at",
        )
        .eq(
          "organization_id",
          organizationId,
        )
        .gte(
          "created_at",
          failureWindowStart,
        ),
    ]);

  if (
    salesResult.error
  ) {
    throw new Error(
      `TODAY sales read failed: ${salesResult.error.message}`,
    );
  }

  if (
    inventoryResult.error
  ) {
    throw new Error(
      `TODAY inventory read failed: ${inventoryResult.error.message}`,
    );
  }

  if (
    alertsResult.error
  ) {
    throw new Error(
      `TODAY inventory alerts read failed: ${alertsResult.error.message}`,
    );
  }

  if (
    accountsResult.error
  ) {
    throw new Error(
      `TODAY marketplace accounts read failed: ${accountsResult.error.message}`,
    );
  }

  if (
    syncLogsResult.error
  ) {
    throw new Error(
      `TODAY marketplace sync logs read failed: ${syncLogsResult.error.message}`,
    );
  }

  const salesSummary =
    (
      salesResult.data ??
      null
    ) as unknown as
      TodaySalesSummaryInput
      | null;

  const inventoryIntelligence =
    (
      inventoryResult.data ??
      null
    ) as unknown as
      TodayInventoryIntelligenceInput
      | null;

  const inventoryAlerts =
    (
      alertsResult.data ??
      null
    ) as unknown as
      readonly unknown[]
      | null;

  const syncLogs =
    (
      syncLogsResult.data ??
      []
    ) as unknown as
      MarketplaceSyncLogRow[];

  const failureCounts =
    countRecentMarketplaceFailures(
      syncLogs,
    );

  const marketplaceAccounts:
    TodayMarketplaceAccountInput[] =
    (
      accountsResult.data ??
      []
    ).map(
      (account) => ({
        id:
          account.id,

        provider:
          account.provider,

        name:
          account.name,

        status:
          account.status,

        last_synced_at:
          account.last_synced_at,

        recent_failed_sync_count:
          failureCounts.get(
            account.id,
          ) ?? 0,
      }),
    );

  return buildLakuvoTodayReadModel({
    organizationId,

    generatedAt,

    salesSummary,

    inventoryIntelligence,

    inventoryAlerts,

    marketplaceAccounts,
  });
}
