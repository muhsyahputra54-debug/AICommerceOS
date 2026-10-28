import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  orchestrateMarketplaceSyncOnce,
  type MarketplaceSyncOrchestratorResult,
  type MarketplaceSyncPageExecutor,
  type MarketplaceSyncRpc,
} from "./sync-orchestrator";

const MARKETPLACE_SYNC_LIFECYCLE_RPCS =
  new Set([
    "claim_marketplace_sync_job",
    "complete_marketplace_sync_job_page",
    "fail_marketplace_sync_job_attempt",
  ]);

export type MarketplaceSyncAdminRpc =
  (
    name: string,
    args: Record<string, unknown>,
  ) =>
    PromiseLike<{
      data: unknown;
      error: unknown;
    }>;

export type MarketplaceSyncAdminClient =
  Readonly<{
    rpc: MarketplaceSyncAdminRpc;
  }>;

export type MarketplaceSyncAdminFactory =
  () =>
    MarketplaceSyncAdminClient;

export type MarketplaceSyncRuntimeDependencies =
  Readonly<{
    executePage:
      MarketplaceSyncPageExecutor;
    createAdmin?:
      MarketplaceSyncAdminFactory;
    now?:
      () => number;
  }>;

function isLifecycleRpc(
  name: string,
) {
  return (
    MARKETPLACE_SYNC_LIFECYCLE_RPCS
      .has(
        name,
      )
  );
}

function createDefaultMarketplaceSyncAdmin():
  MarketplaceSyncAdminClient {
  const admin =
    createAdminClient();

  return Object.freeze({
    rpc:
      async (
        name,
        args,
      ) => {
        const result =
          await admin.rpc(
            name,
            args,
          );

        return {
          data:
            result.data,
          error:
            result.error,
        };
      },
  });
}

/**
 * Builds the privileged database boundary used by the marketplace
 * sync orchestrator.
 *
 * The adapter intentionally exposes only the three lifecycle RPCs
 * established by M1.4B. Provider execution is not part of this
 * boundary and remains an injected executePage dependency.
 */
export function createMarketplaceSyncLifecycleRpc(
  createAdmin:
    MarketplaceSyncAdminFactory =
      createDefaultMarketplaceSyncAdmin,
):
  MarketplaceSyncRpc {
  let admin:
    MarketplaceSyncAdminClient |
    null = null;

  return async (
    name,
    args,
  ) => {
    if (
      !isLifecycleRpc(
        name,
      )
    ) {
      return {
        data: null,
        error: true,
      };
    }

    try {
      if (!admin) {
        admin =
          createAdmin();
      }

      const result =
        await admin.rpc(
          name,
          args,
        );

      return {
        data:
          result.data,
        error:
          result.error,
      };
    } catch {
      return {
        data: null,
        error: true,
      };
    }
  };
}

/**
 * Executes at most one marketplace sync page.
 *
 * Database lifecycle wiring is production-capable here, while the
 * provider page executor remains mandatory injection. M1.5/M1.6
 * provide the TikTok product/order executors rather than coupling
 * provider HTTP into this runtime foundation.
 */
export async function runMarketplaceSyncRuntimeOnce(
  input:
    Readonly<{
      jobId?:
        string | null;
    }>,
  dependencies:
    MarketplaceSyncRuntimeDependencies,
):
  Promise<
    MarketplaceSyncOrchestratorResult
  > {
  const rpc =
    createMarketplaceSyncLifecycleRpc(
      dependencies.createAdmin,
    );

  return orchestrateMarketplaceSyncOnce(
    input,
    {
      rpc,
      executePage:
        dependencies.executePage,
      now:
        dependencies.now ??
        Date.now,
    },
  );
}