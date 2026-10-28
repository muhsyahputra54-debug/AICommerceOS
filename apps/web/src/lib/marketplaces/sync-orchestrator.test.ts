import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  MarketplaceSyncExecutionError,
  orchestrateMarketplaceSyncOnce,
  type MarketplaceSyncPageExecutor,
  type MarketplaceSyncRpc,
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
    "2026-10-28T01:00:00Z",
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
      "req-001",
    ...overrides,
  };
}

function harness(
  options:
    Readonly<{
      claimData?: unknown;
      rpcError?: string;
      completeStatus?: unknown;
      failureStatus?: unknown;
      executeResult?: MarketplaceSyncResult;
      executeError?: unknown;
    }> = {},
) {
  const events:
    string[] = [];

  const rpc =
    vi.fn<MarketplaceSyncRpc>(
      async (
        name,
        _args,
      ) => {
        void _args;

        events.push(
          name,
        );

        if (
          options.rpcError ===
          name
        ) {
          return {
            data: null,
            error:
              new Error(
                "synthetic rpc failure",
              ),
          };
        }

        if (
          name ===
          "claim_marketplace_sync_job"
        ) {
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
            error: null,
          };
        }

        if (
          name ===
          "fail_marketplace_sync_job_attempt"
        ) {
          return {
            data:
              options.failureStatus ??
              "queued",
            error: null,
          };
        }

        return {
          data: null,
          error:
            new Error(
              "unexpected rpc",
            ),
        };
      },
    );

  const executePage =
    vi.fn<MarketplaceSyncPageExecutor>(
      async (
        _input,
      ) => {
        void _input;

        events.push(
          "execute",
        );

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
      orchestrateMarketplaceSyncOnce(
        input,
        {
          rpc,
          executePage,
          now: () =>
            nowMs,
        },
      );

  return {
    rpc,
    executePage,
    events,
    run,
  };
}

function rpcArgs(
  rpc:
    ReturnType<
      typeof vi.fn<MarketplaceSyncRpc>
    >,
  name: string,
) {
  const call =
    rpc.mock.calls.find(
      ([calledName]) =>
        calledName === name,
    );

  return call?.[1];
}

describe(
  "marketplace sync orchestrator",
  () => {
    it(
      "returns idle without executing a provider page when no job is claimable",
      async () => {
        const h =
          harness({
            claimData: [],
          });

        await expect(
          h.run(),
        ).resolves.toEqual({
          kind:
            "idle",
        });

        expect(
          h.events,
        ).toEqual([
          "claim_marketplace_sync_job",
        ]);

        expect(
          h.executePage,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects an invalid requested job id before any RPC",
      async () => {
        const h =
          harness();

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
          h.events,
        ).toEqual([]);
      },
    );

    it(
      "completes a final page only after provider execution succeeds",
      async () => {
        const h =
          harness();

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
          h.events,
        ).toEqual([
          "claim_marketplace_sync_job",
          "execute",
          "complete_marketplace_sync_job_page",
        ]);

        expect(
          rpcArgs(
            h.rpc,
            "complete_marketplace_sync_job_page",
          ),
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
            "req-001",
        });
      },
    );

    it(
      "requeues the same durable job when a page returns a next cursor",
      async () => {
        const nextCursor =
          createMarketplaceSyncCursor(
            "page_token",
            "next-page",
          );

        const h =
          harness({
            executeResult:
              pageResult({
                totalCount:
                  250,
                hasMore:
                  true,
                nextCursor,
              }),
            completeStatus:
              "queued",
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
            2,
          processedCount:
            2,
        });

        expect(
          rpcArgs(
            h.rpc,
            "complete_marketplace_sync_job_page",
          ),
        ).toMatchObject({
          p_cursor_kind:
            "page_token",
          p_cursor_value:
            "next-page",
        });
      },
    );

    it(
      "fails unsupported provider/entity capability before executor dispatch",
      async () => {
        const h =
          harness({
            claimData: [
              claim({
                provider:
                  "shopee",
                entity:
                  "products",
              }),
            ],
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
            "unsupported",
        });

        expect(
          h.executePage,
        ).not.toHaveBeenCalled();

        expect(
          rpcArgs(
            h.rpc,
            "fail_marketplace_sync_job_attempt",
          ),
        ).toMatchObject({
          p_error_code:
            "unsupported",
          p_retryable:
            false,
        });
      },
    );

    it(
      "records scope failure as terminal without retrying provider execution",
      async () => {
        const h =
          harness({
            executeError:
              new MarketplaceSyncExecutionError(
                "scope_missing",
                "Required marketplace scope is missing.",
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
          rpcArgs(
            h.rpc,
            "fail_marketplace_sync_job_attempt",
          ),
        ).toMatchObject({
          p_error_code:
            "scope_missing",
          p_retryable:
            false,
        });
      },
    );

    it(
      "allows provider failures to be rescheduled by the lifecycle RPC",
      async () => {
        const h =
          harness({
            executeError:
              new MarketplaceSyncExecutionError(
                "provider_error",
                "Provider temporarily unavailable.",
              ),
            failureStatus:
              "queued",
          });

        await expect(
          h.run(),
        ).resolves.toEqual({
          kind:
            "execution_failed",
          jobId,
          status:
            "queued",
          errorCode:
            "provider_error",
        });

        expect(
          rpcArgs(
            h.rpc,
            "fail_marketplace_sync_job_attempt",
          ),
        ).toMatchObject({
          p_error_code:
            "provider_error",
          p_retryable:
            true,
        });
      },
    );

    it(
      "fails malformed executor results closed as invalid_response",
      async () => {
        const h =
          harness({
            executeResult: {
              ...pageResult(),
              entity:
                "orders",
            },
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
            "invalid_response",
        });

        expect(
          rpcArgs(
            h.rpc,
            "fail_marketplace_sync_job_attempt",
          ),
        ).toMatchObject({
          p_error_code:
            "invalid_response",
          p_retryable:
            false,
        });
      },
    );

    it(
      "rejects a total count smaller than the synced page count",
      async () => {
        const h =
          harness({
            executeResult:
              pageResult({
                syncedCount:
                  3,
                totalCount:
                  2,
              }),
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
            "invalid_response",
        });

        expect(
          rpcArgs(
            h.rpc,
            "fail_marketplace_sync_job_attempt",
          ),
        ).toMatchObject({
          p_error_code:
            "invalid_response",
          p_retryable:
            false,
        });
      },
    );
    it(
      "requires recovery when completion acknowledgement is uncertain and never sends a fallback failure",
      async () => {
        const h =
          harness({
            rpcError:
              "complete_marketplace_sync_job_page",
          });

        await expect(
          h.run(),
        ).resolves.toEqual({
          kind:
            "recovery_required",
          jobId,
        });

        expect(
          h.events,
        ).toEqual([
          "claim_marketplace_sync_job",
          "execute",
          "complete_marketplace_sync_job_page",
        ]);

        expect(
          h.rpc.mock.calls.some(
            ([name]) =>
              name ===
              "fail_marketplace_sync_job_attempt",
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      "refuses an expired lease before provider execution",
      async () => {
        const h =
          harness({
            claimData: [
              claim({
                lease_expires_at:
                  new Date(
                    nowMs - 1,
                  ).toISOString(),
              }),
            ],
          });

        await expect(
          h.run(),
        ).resolves.toEqual({
          kind:
            "recovery_required",
          jobId:
            null,
        });

        expect(
          h.executePage,
        ).not.toHaveBeenCalled();

        expect(
          h.rpc.mock.calls.some(
            ([name]) =>
              name ===
              "fail_marketplace_sync_job_attempt",
          ),
        ).toBe(
          false,
        );
      },
    );
  },
);