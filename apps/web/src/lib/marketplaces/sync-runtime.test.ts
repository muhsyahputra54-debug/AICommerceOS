import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createMarketplaceSyncLifecycleRpc,
  runMarketplaceSyncRuntimeOnce,
  type MarketplaceSyncAdminFactory,
  type MarketplaceSyncAdminRpc,
} from "./sync-runtime";
import {
  MarketplaceSyncExecutionError,
  type MarketplaceSyncPageExecutor,
} from "./sync-orchestrator";
import {
  createMarketplaceSyncCursor,
  type MarketplaceSyncResult,
} from "./sync-contract";

const jobId =
  "11111111-1111-4111-8111-111111111111";

const organizationId =
  "22222222-2222-4222-8222-222222222222";

const accountId =
  "33333333-3333-4333-8333-333333333333";

const shopId =
  "44444444-4444-4444-8444-444444444444";

const leaseToken =
  "55555555-5555-4555-8555-555555555555";

const nowMs =
  Date.parse(
    "2026-10-28T03:00:00Z",
  );

function claim(
  overrides:
    Record<string, unknown> = {},
) {
  return {
    id:
      jobId,
    organization_id:
      organizationId,
    marketplace_account_id:
      accountId,
    authorized_shop_id:
      shopId,
    provider:
      "tiktok_shop",
    entity:
      "products",
    cursor_kind:
      null,
    cursor_value:
      null,
    processed_count:
      0,
    total_count:
      null,
    attempt_count:
      1,
    max_attempts:
      5,
    lease_token:
      leaseToken,
    lease_expires_at:
      new Date(
        nowMs +
        5 * 60 * 1000,
      ).toISOString(),
    ...overrides,
  };
}

function pageResult(
  overrides:
    Partial<
      MarketplaceSyncResult
    > = {},
):
  MarketplaceSyncResult {
  return {
    entity:
      "products",
    syncedCount:
      2,
    totalCount:
      2,
    hasMore:
      false,
    nextCursor:
      null,
    requestId:
      "req-runtime-001",
    ...overrides,
  };
}

function runtimeHarness(
  options:
    Readonly<{
      claimData?: unknown;
      claimError?: unknown;
      completeStatus?: unknown;
      completeError?: unknown;
      failureStatus?: unknown;
      failureError?: unknown;
      executeResult?:
        MarketplaceSyncResult;
      executeError?:
        unknown;
    }> = {},
) {
  const rpc =
    vi.fn<MarketplaceSyncAdminRpc>(
      async (
        name,
        _args,
      ) => {
        void _args;

        if (
          name ===
          "claim_marketplace_sync_job"
        ) {
          if (options.claimError) {
            return {
              data: null,
              error:
                options.claimError,
            };
          }

          return {
            data:
              options.claimData ??
              [
                claim(),
              ],
            error: null,
          };
        }

        if (
          name ===
          "complete_marketplace_sync_job_page"
        ) {
          return {
            data:
              options.completeStatus ??
              "succeeded",
            error:
              options.completeError ??
              null,
          };
        }

        if (
          name ===
          "fail_marketplace_sync_job_attempt"
        ) {
          return {
            data:
              options.failureStatus ??
              "failed",
            error:
              options.failureError ??
              null,
          };
        }

        return {
          data: null,
          error:
            new Error(
              "unexpected admin rpc",
            ),
        };
      },
    );

  const createAdmin =
    vi.fn<MarketplaceSyncAdminFactory>(
      () => ({
        rpc,
      }),
    );

  const executePage =
    vi.fn<MarketplaceSyncPageExecutor>(
      async () => {
        if (
          options.executeError
        ) {
          throw options.executeError;
        }

        return (
          options.executeResult ??
          pageResult()
        );
      },
    );

  const run =
    (
      input:
        Readonly<{
          jobId?:
            string | null;
        }> = {},
    ) =>
      runMarketplaceSyncRuntimeOnce(
        input,
        {
          createAdmin,
          executePage,
          now:
            () => nowMs,
        },
      );

  return {
    rpc,
    createAdmin,
    executePage,
    run,
  };
}

describe(
  "marketplace sync runtime wiring",
  () => {
    it(
      "rejects an invalid requested job before creating the privileged client",
      async () => {
        const h =
          runtimeHarness();

        await expect(
          h.run({
            jobId:
              "not-a-uuid",
          }),
        ).resolves.toEqual({
          kind:
            "configuration_invalid",
        });

        expect(
          h.createAdmin,
        ).not.toHaveBeenCalled();

        expect(
          h.rpc,
        ).not.toHaveBeenCalled();

        expect(
          h.executePage,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "wires one final page through claim and completion using one lazy admin client",
      async () => {
        const h =
          runtimeHarness();

        await expect(
          h.run({
            jobId,
          }),
        ).resolves.toEqual({
          kind:
            "progressed",
          jobId,
          status:
            "succeeded",
          entity:
            "products",
          syncedCount:
            2,
          processedCount:
            2,
        });

        expect(
          h.createAdmin,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          h.rpc.mock.calls.map(
            call =>
              call[0],
          ),
        ).toEqual([
          "claim_marketplace_sync_job",
          "complete_marketplace_sync_job_page",
        ]);

        expect(
          h.rpc.mock.calls[0]?.[1],
        ).toEqual({
          p_job_id:
            jobId,
        });

        expect(
          h.rpc.mock.calls[1]?.[1],
        ).toEqual({
          p_job_id:
            jobId,
          p_lease_token:
            leaseToken,
          p_synced_count:
            2,
          p_total_count:
            2,
          p_cursor_kind:
            null,
          p_cursor_value:
            null,
          p_request_id:
            "req-runtime-001",
        });

        expect(
          h.executePage,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "wires cursor continuation back to queued without provider-specific logic",
      async () => {
        const nextCursor =
          createMarketplaceSyncCursor(
            "page_token",
            "next-page-token",
          );

        const h =
          runtimeHarness({
            completeStatus:
              "queued",
            executeResult:
              pageResult({
                syncedCount:
                  100,
                totalCount:
                  250,
                hasMore:
                  true,
                nextCursor,
                requestId:
                  "req-runtime-page-1",
              }),
          });

        await expect(
          h.run(),
        ).resolves.toEqual({
          kind:
            "progressed",
          jobId,
          status:
            "queued",
          entity:
            "products",
          syncedCount:
            100,
          processedCount:
            100,
        });

        expect(
          h.rpc.mock.calls[1]?.[1],
        ).toMatchObject({
          p_cursor_kind:
            "page_token",
          p_cursor_value:
            "next-page-token",
          p_request_id:
            "req-runtime-page-1",
        });
      },
    );

    it(
      "maps an admin claim failure to claim_unavailable without executing a page",
      async () => {
        const h =
          runtimeHarness({
            claimError:
              new Error(
                "synthetic database failure",
              ),
          });

        await expect(
          h.run(),
        ).resolves.toEqual({
          kind:
            "claim_unavailable",
        });

        expect(
          h.executePage,
        ).not.toHaveBeenCalled();

        expect(
          h.rpc,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "routes typed execution failure through the lifecycle failure RPC",
      async () => {
        const h =
          runtimeHarness({
            executeError:
              new MarketplaceSyncExecutionError(
                "scope_missing",
                "Required provider scope is unavailable.",
              ),
            failureStatus:
              "failed",
          });

        await expect(
          h.run(),
        ).resolves.toEqual({
          kind:
            "execution_failed",
          jobId,
          status:
            "failed",
          errorCode:
            "scope_missing",
        });

        expect(
          h.rpc.mock.calls.map(
            call =>
              call[0],
          ),
        ).toEqual([
          "claim_marketplace_sync_job",
          "fail_marketplace_sync_job_attempt",
        ]);

        expect(
          h.rpc.mock.calls[1]?.[1],
        ).toMatchObject({
          p_job_id:
            jobId,
          p_lease_token:
            leaseToken,
          p_error_code:
            "scope_missing",
          p_retryable:
            false,
        });
      },
    );

    it(
      "blocks unknown privileged RPC names before creating an admin client",
      async () => {
        const rpc =
          vi.fn<MarketplaceSyncAdminRpc>(
            async () => ({
              data:
                "should-not-run",
              error: null,
            }),
          );

        const createAdmin =
          vi.fn<MarketplaceSyncAdminFactory>(
            () => ({
              rpc,
            }),
          );

        const lifecycleRpc =
          createMarketplaceSyncLifecycleRpc(
            createAdmin,
          );

        await expect(
          lifecycleRpc(
            "unexpected_privileged_rpc",
            {},
          ),
        ).resolves.toEqual({
          data: null,
          error: true,
        });

        expect(
          createAdmin,
        ).not.toHaveBeenCalled();

        expect(
          rpc,
        ).not.toHaveBeenCalled();
      },
    );
  },
);