import type {
  MarketplaceProviderId,
} from "./provider-contract";
import {
  isMarketplaceSyncPreflightError,
  requireMarketplaceSyncPreflight,
  type MarketplaceSyncPreflight,
} from "./provider-preflight";
import {
  createMarketplaceSyncCursor,
  type MarketplaceSyncCursor,
  type MarketplaceSyncEntity,
  type MarketplaceSyncErrorCode,
  type MarketplaceSyncResult,
} from "./sync-contract";

export type MarketplaceSyncJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type MarketplaceSyncJobClaim =
  Readonly<{
    id: string;
    organizationId: string;
    marketplaceAccountId: string;
    authorizedShopId: string | null;
    provider: MarketplaceProviderId;
    entity: MarketplaceSyncEntity;
    cursor: MarketplaceSyncCursor | null;
    processedCount: number;
    totalCount: number | null;
    attemptCount: number;
    maxAttempts: number;
    leaseToken: string;
    leaseExpiresAt: string;
  }>;

export type MarketplaceSyncRpc =
  (
    name: string,
    args: Record<string, unknown>,
  ) =>
    Promise<{
      data: unknown;
      error: unknown;
    }>;

export type MarketplaceSyncPageExecutor =
  (
    input:
      Readonly<{
        job: MarketplaceSyncJobClaim;
        preflight: MarketplaceSyncPreflight;
      }>,
  ) =>
    Promise<MarketplaceSyncResult>;

export type MarketplaceSyncOrchestratorDependencies =
  Readonly<{
    rpc: MarketplaceSyncRpc;
    executePage: MarketplaceSyncPageExecutor;
    now: () => number;
  }>;

export type MarketplaceSyncOrchestratorResult =
  | Readonly<{
      kind: "idle";
    }>
  | Readonly<{
      kind: "progressed";
      jobId: string;
      status:
        | "queued"
        | "succeeded";
      entity: MarketplaceSyncEntity;
      syncedCount: number;
      processedCount: number;
    }>
  | Readonly<{
      kind: "execution_failed";
      jobId: string;
      status:
        | "queued"
        | "failed";
      errorCode: MarketplaceSyncErrorCode;
    }>
  | Readonly<{
      kind: "configuration_invalid";
    }>
  | Readonly<{
      kind: "claim_unavailable";
    }>
  | Readonly<{
      kind: "recovery_required";
      jobId: string | null;
    }>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PROVIDERS =
  new Set<MarketplaceProviderId>([
    "tiktok_shop",
    "shopee",
  ]);

const ENTITIES =
  new Set<MarketplaceSyncEntity>([
    "shops",
    "products",
    "orders",
    "inventory",
  ]);

const RETRYABLE_ERROR_CODES =
  new Set<MarketplaceSyncErrorCode>([
    "provider_error",
    "persistence_error",
  ]);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeUuid(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return UUID_PATTERN.test(
    normalized,
  )
    ? normalized
    : null;
}

function normalizeInteger(
  value: unknown,
  minimum: number,
  maximum =
    Number.MAX_SAFE_INTEGER,
) {
  let parsed:
    number;

  if (
    typeof value === "number"
  ) {
    parsed =
      value;
  } else if (
    typeof value === "string" &&
    /^\d+$/.test(
      value,
    )
  ) {
    parsed =
      Number(
        value,
      );
  } else {
    return null;
  }

  if (
    !Number.isSafeInteger(
      parsed,
    ) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    return null;
  }

  return parsed;
}

function normalizeProvider(
  value: unknown,
):
  MarketplaceProviderId | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  return PROVIDERS.has(
    normalized as MarketplaceProviderId,
  )
    ? normalized as MarketplaceProviderId
    : null;
}

function normalizeEntity(
  value: unknown,
):
  MarketplaceSyncEntity | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  return ENTITIES.has(
    normalized as MarketplaceSyncEntity,
  )
    ? normalized as MarketplaceSyncEntity
    : null;
}

function normalizeCursor(
  kind: unknown,
  value: unknown,
):
  MarketplaceSyncCursor | null | undefined {
  if (
    kind === null &&
    value === null
  ) {
    return null;
  }

  if (
    typeof kind !== "string" ||
    typeof value !== "string"
  ) {
    return undefined;
  }

  try {
    return createMarketplaceSyncCursor(
      kind.trim().toLowerCase() as
        MarketplaceSyncCursor["kind"],
      value,
    );
  } catch {
    return undefined;
  }
}

function normalizeClaim(
  value: unknown,
  nowMs: number,
):
  MarketplaceSyncJobClaim | null {
  if (!isRecord(value)) {
    return null;
  }

  const id =
    normalizeUuid(
      value.id,
    );

  const organizationId =
    normalizeUuid(
      value.organization_id,
    );

  const marketplaceAccountId =
    normalizeUuid(
      value.marketplace_account_id,
    );

  const provider =
    normalizeProvider(
      value.provider,
    );

  const entity =
    normalizeEntity(
      value.entity,
    );

  const leaseToken =
    normalizeUuid(
      value.lease_token,
    );

  if (
    !id ||
    !organizationId ||
    !marketplaceAccountId ||
    !provider ||
    !entity ||
    !leaseToken
  ) {
    return null;
  }

  const processedCount =
    normalizeInteger(
      value.processed_count,
      0,
    );

  const attemptCount =
    normalizeInteger(
      value.attempt_count,
      1,
      20,
    );

  const maxAttempts =
    normalizeInteger(
      value.max_attempts,
      1,
      20,
    );

  if (
    processedCount === null ||
    attemptCount === null ||
    maxAttempts === null ||
    attemptCount > maxAttempts
  ) {
    return null;
  }

  const totalCount =
    value.total_count === null
      ? null
      : normalizeInteger(
          value.total_count,
          0,
        );

  if (
    value.total_count !== null &&
    totalCount === null
  ) {
    return null;
  }

  const cursor =
    normalizeCursor(
      value.cursor_kind,
      value.cursor_value,
    );

  if (cursor === undefined) {
    return null;
  }

  const authorizedShopId =
    value.authorized_shop_id === null
      ? null
      : normalizeUuid(
          value.authorized_shop_id,
        );

  if (
    entity === "shops"
  ) {
    if (
      authorizedShopId !== null
    ) {
      return null;
    }
  } else if (
    !authorizedShopId
  ) {
    return null;
  }

  if (
    typeof value.lease_expires_at !==
      "string"
  ) {
    return null;
  }

  const leaseExpiresAt =
    value.lease_expires_at.trim();

  const leaseExpiryMs =
    Date.parse(
      leaseExpiresAt,
    );

  if (
    !Number.isFinite(
      leaseExpiryMs,
    ) ||
    leaseExpiryMs <= nowMs
  ) {
    return null;
  }

  return Object.freeze({
    id,
    organizationId,
    marketplaceAccountId,
    authorizedShopId,
    provider,
    entity,
    cursor,
    processedCount,
    totalCount,
    attemptCount,
    maxAttempts,
    leaseToken,
    leaseExpiresAt,
  });
}

function normalizeRequestId(
  value: unknown,
):
  string | null | undefined {
  if (value === null) {
    return null;
  }

  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized || null;
}

function normalizeExecutionResult(
  value: unknown,
  expectedEntity:
    MarketplaceSyncEntity,
):
  MarketplaceSyncResult | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.entity !==
      expectedEntity
  ) {
    return null;
  }

  const syncedCount =
    normalizeInteger(
      value.syncedCount,
      0,
    );

  if (
    syncedCount === null
  ) {
    return null;
  }

  const totalCount =
    value.totalCount === null
      ? null
      : normalizeInteger(
          value.totalCount,
          0,
        );

  if (
    value.totalCount !== null &&
    totalCount === null
  ) {
    return null;
  }

  if (
    totalCount !== null &&
    totalCount < syncedCount
  ) {
    return null;
  }

  if (
    typeof value.hasMore !==
      "boolean"
  ) {
    return null;
  }

  let nextCursor:
    MarketplaceSyncCursor | null;

  if (
    value.nextCursor === null
  ) {
    nextCursor =
      null;
  } else if (
    isRecord(
      value.nextCursor,
    )
  ) {
    const cursor =
      normalizeCursor(
        value.nextCursor.kind,
        value.nextCursor.value,
      );

    if (
      !cursor
    ) {
      return null;
    }

    nextCursor =
      cursor;
  } else {
    return null;
  }

  if (
    value.hasMore !==
      (nextCursor !== null)
  ) {
    return null;
  }

  const requestId =
    normalizeRequestId(
      value.requestId,
    );

  if (
    requestId === undefined
  ) {
    return null;
  }

  return Object.freeze({
    entity:
      expectedEntity,
    syncedCount,
    totalCount,
    hasMore:
      value.hasMore,
    nextCursor,
    requestId,
  });
}

function safeMessage(
  value: string,
) {
  const normalized =
    value.trim();

  if (!normalized) {
    return (
      "Marketplace sync execution failed."
    );
  }

  return normalized.slice(
    0,
    500,
  );
}

export class MarketplaceSyncExecutionError
  extends Error {
  readonly code:
    MarketplaceSyncErrorCode;

  readonly retryable:
    boolean;

  constructor(
    code:
      MarketplaceSyncErrorCode,
    message: string,
  ) {
    super(
      safeMessage(
        message,
      ),
    );

    this.name =
      "MarketplaceSyncExecutionError";

    this.code =
      code;

    this.retryable =
      RETRYABLE_ERROR_CODES.has(
        code,
      );
  }
}

async function callRpc(
  rpc:
    MarketplaceSyncRpc,
  name: string,
  args:
    Record<string, unknown>,
) {
  try {
    return await rpc(
      name,
      args,
    );
  } catch {
    return {
      data: null,
      error: true,
    };
  }
}

async function settleFailure(
  rpc:
    MarketplaceSyncRpc,
  job:
    MarketplaceSyncJobClaim,
  error:
    MarketplaceSyncExecutionError,
):
  Promise<
    MarketplaceSyncOrchestratorResult
  > {
  const finalized =
    await callRpc(
      rpc,
      "fail_marketplace_sync_job_attempt",
      {
        p_job_id:
          job.id,
        p_lease_token:
          job.leaseToken,
        p_error_code:
          error.code,
        p_error_message:
          error.message,
        p_retryable:
          error.retryable,
      },
    );

  if (
    finalized.error ||
    (
      finalized.data !==
        "queued" &&
      finalized.data !==
        "failed"
    )
  ) {
    return {
      kind:
        "recovery_required",
      jobId:
        job.id,
    };
  }

  if (
    !error.retryable &&
    finalized.data !==
      "failed"
  ) {
    return {
      kind:
        "recovery_required",
      jobId:
        job.id,
    };
  }

  return {
    kind:
      "execution_failed",
    jobId:
      job.id,
    status:
      finalized.data,
    errorCode:
      error.code,
  };
}

export async function orchestrateMarketplaceSyncOnce(
  input:
    Readonly<{
      jobId?:
        string | null;
    }>,
  dependencies:
    MarketplaceSyncOrchestratorDependencies,
):
  Promise<
    MarketplaceSyncOrchestratorResult
  > {
  let nowMs:
    number;

  try {
    nowMs =
      dependencies.now();
  } catch {
    return {
      kind:
        "configuration_invalid",
    };
  }

  if (
    !Number.isSafeInteger(
      nowMs,
    ) ||
    nowMs < 0
  ) {
    return {
      kind:
        "configuration_invalid",
    };
  }

  let requestedJobId:
    string | null = null;

  if (
    input.jobId !== null &&
    input.jobId !== undefined
  ) {
    requestedJobId =
      normalizeUuid(
        input.jobId,
      );

    if (!requestedJobId) {
      return {
        kind:
          "configuration_invalid",
      };
    }
  }

  const claimed =
    await callRpc(
      dependencies.rpc,
      "claim_marketplace_sync_job",
      {
        p_job_id:
          requestedJobId,
      },
    );

  if (claimed.error) {
    return {
      kind:
        "claim_unavailable",
    };
  }

  if (
    !Array.isArray(
      claimed.data,
    )
  ) {
    return {
      kind:
        "recovery_required",
      jobId:
        requestedJobId,
    };
  }

  if (
    claimed.data.length === 0
  ) {
    return {
      kind:
        "idle",
    };
  }

  if (
    claimed.data.length !== 1
  ) {
    return {
      kind:
        "recovery_required",
      jobId:
        requestedJobId,
    };
  }

  const job =
    normalizeClaim(
      claimed.data[0],
      nowMs,
    );

  if (!job) {
    return {
      kind:
        "recovery_required",
      jobId:
        requestedJobId,
    };
  }

  if (
    requestedJobId !== null &&
    job.id !==
      requestedJobId
  ) {
    return {
      kind:
        "recovery_required",
      jobId:
        requestedJobId,
    };
  }

  let preflight:
    MarketplaceSyncPreflight;

  try {
    preflight =
      requireMarketplaceSyncPreflight(
        job.provider,
        job.entity,
      );
  } catch (error) {
    if (
      isMarketplaceSyncPreflightError(
        error,
      )
    ) {
      return settleFailure(
        dependencies.rpc,
        job,
        new MarketplaceSyncExecutionError(
          "unsupported",
          error.message,
        ),
      );
    }

    return settleFailure(
      dependencies.rpc,
      job,
      new MarketplaceSyncExecutionError(
        "persistence_error",
        "Marketplace sync preflight failed.",
      ),
    );
  }

  if (
    preflight.provider !==
      job.provider ||
    preflight.entity !==
      job.entity
  ) {
    return settleFailure(
      dependencies.rpc,
      job,
      new MarketplaceSyncExecutionError(
        "persistence_error",
        "Marketplace sync preflight identity mismatch.",
      ),
    );
  }

  let rawResult:
    MarketplaceSyncResult;

  try {
    rawResult =
      await dependencies
        .executePage({
          job,
          preflight,
        });
  } catch (error) {
    const executionError =
      error instanceof
        MarketplaceSyncExecutionError
        ? error
        : new MarketplaceSyncExecutionError(
            "provider_error",
            "Marketplace sync provider execution failed.",
          );

    return settleFailure(
      dependencies.rpc,
      job,
      executionError,
    );
  }

  const result =
    normalizeExecutionResult(
      rawResult,
      job.entity,
    );

  if (!result) {
    return settleFailure(
      dependencies.rpc,
      job,
      new MarketplaceSyncExecutionError(
        "invalid_response",
        "Marketplace sync executor returned an invalid result.",
      ),
    );
  }

  const processedCount =
    job.processedCount +
    result.syncedCount;

  if (
    !Number.isSafeInteger(
      processedCount,
    )
  ) {
    return settleFailure(
      dependencies.rpc,
      job,
      new MarketplaceSyncExecutionError(
        "invalid_response",
        "Marketplace sync processed count exceeded the safe integer range.",
      ),
    );
  }

  const completed =
    await callRpc(
      dependencies.rpc,
      "complete_marketplace_sync_job_page",
      {
        p_job_id:
          job.id,
        p_lease_token:
          job.leaseToken,
        p_synced_count:
          result.syncedCount,
        p_total_count:
          result.totalCount,
        p_cursor_kind:
          result.nextCursor?.kind ??
          null,
        p_cursor_value:
          result.nextCursor?.value ??
          null,
        p_request_id:
          result.requestId,
      },
    );

  if (
    completed.error ||
    (
      completed.data !==
        "queued" &&
      completed.data !==
        "succeeded"
    )
  ) {
    return {
      kind:
        "recovery_required",
      jobId:
        job.id,
    };
  }

  if (
    result.nextCursor !== null &&
    completed.data !==
      "queued"
  ) {
    return {
      kind:
        "recovery_required",
      jobId:
        job.id,
    };
  }

  if (
    result.nextCursor === null &&
    completed.data !==
      "succeeded"
  ) {
    return {
      kind:
        "recovery_required",
      jobId:
        job.id,
    };
  }

  return {
    kind:
      "progressed",
    jobId:
      job.id,
    status:
      completed.data,
    entity:
      job.entity,
    syncedCount:
      result.syncedCount,
    processedCount,
  };
}