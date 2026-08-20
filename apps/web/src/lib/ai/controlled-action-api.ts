export const CONTROLLED_ACTION_API_STATUSES = [
  "proposed",
  "confirmed",
  "executing",
  "executed",
  "stale",
  "failed",
  "cancelled",
] as const;

export type ControlledActionApiStatus =
  (typeof CONTROLLED_ACTION_API_STATUSES)[number];

export type ControlledActionProposalInput = {
  productId: string;
  expectedDescription: string | null;
  proposedDescription: string;
  idempotencyKey: string;
};

export type ControlledActionApiRecord = {
  id: string;
  contractVersion: 1;
  actionType: "product.update_description";
  status: ControlledActionApiStatus;
  targetResource: "product";
  targetId: string;
  expectedDescription: string | null;
  proposedDescription: string;
  createdAt: string;
  confirmedAt: string | null;
  executionStartedAt: string | null;
  finalizedAt: string | null;
  errorMessage: string | null;
};

type ProposalParseResult =
  | {
      ok: true;
      value: ControlledActionProposalInput;
    }
  | {
      ok: false;
      error: string;
    };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PROPOSAL_KEYS =
  new Set([
    "productId",
    "expectedDescription",
    "proposedDescription",
    "idempotencyKey",
  ]);

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function isUuid(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    UUID_PATTERN.test(value)
  );
}

function isNullableString(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    typeof value === "string"
  );
}

function isNullableTimestamp(
  value: unknown,
): value is string | null {
  return isNullableString(value);
}

export function parseControlledActionProposalInput(
  value: unknown,
): ProposalParseResult {
  if (!isPlainObject(value)) {
    return {
      ok: false,
      error:
        "Data controlled action tidak valid.",
    };
  }

  const unexpectedKey =
    Object.keys(value).find(
      (key) =>
        !PROPOSAL_KEYS.has(key),
    );

  if (unexpectedKey) {
    return {
      ok: false,
      error:
        "Controlled action hanya menerima field yang diizinkan.",
    };
  }

  if (!isUuid(value.productId)) {
    return {
      ok: false,
      error:
        "Product ID tidak valid.",
    };
  }

  if (
    !isNullableString(
      value.expectedDescription,
    )
  ) {
    return {
      ok: false,
      error:
        "Expected description tidak valid.",
    };
  }

  if (
    typeof value.proposedDescription !==
    "string"
  ) {
    return {
      ok: false,
      error:
        "Proposed description tidak valid.",
    };
  }

  const proposedDescription =
    value.proposedDescription.trim();

  if (!proposedDescription) {
    return {
      ok: false,
      error:
        "Proposed description wajib diisi.",
    };
  }

  if (
    typeof value.idempotencyKey !==
    "string"
  ) {
    return {
      ok: false,
      error:
        "Idempotency key tidak valid.",
    };
  }

  const idempotencyKey =
    value.idempotencyKey.trim();

  if (
    idempotencyKey.length < 1 ||
    idempotencyKey.length > 128
  ) {
    return {
      ok: false,
      error:
        "Idempotency key tidak valid.",
    };
  }

  return {
    ok: true,
    value: {
      productId:
        value.productId,

      // Preserve the exact current snapshot.
      expectedDescription:
        value.expectedDescription,

      // Persisted contract requires trimmed proposal text.
      proposedDescription,

      idempotencyKey,
    },
  };
}

export function parseControlledActionId(
  value: unknown,
) {
  return isUuid(value)
    ? value
    : null;
}

function isControlledActionStatus(
  value: unknown,
): value is ControlledActionApiStatus {
  return (
    typeof value === "string" &&
    (
      CONTROLLED_ACTION_API_STATUSES as
        readonly string[]
    ).includes(value)
  );
}

export function projectControlledActionRecord(
  value: unknown,
): ControlledActionApiRecord | null {
  if (!isPlainObject(value)) {
    return null;
  }

  if (
    !isUuid(value.id) ||
    value.contract_version !== 1 ||
    value.action_type !==
      "product.update_description" ||
    !isControlledActionStatus(
      value.status,
    ) ||
    value.target_resource !==
      "product" ||
    !isUuid(value.target_id) ||
    !isNullableString(
      value.expected_description,
    ) ||
    typeof value.proposed_description !==
      "string" ||
    typeof value.created_at !==
      "string" ||
    !isNullableTimestamp(
      value.confirmed_at,
    ) ||
    !isNullableTimestamp(
      value.execution_started_at,
    ) ||
    !isNullableTimestamp(
      value.finalized_at,
    ) ||
    !isNullableString(
      value.error_message,
    )
  ) {
    return null;
  }

  return {
    id: value.id,
    contractVersion: 1,
    actionType:
      "product.update_description",
    status: value.status,
    targetResource: "product",
    targetId: value.target_id,
    expectedDescription:
      value.expected_description,
    proposedDescription:
      value.proposed_description,
    createdAt:
      value.created_at,
    confirmedAt:
      value.confirmed_at,
    executionStartedAt:
      value.execution_started_at,
    finalizedAt:
      value.finalized_at,
    errorMessage:
      value.error_message,
  };
}

export function extractControlledActionId(
  value: unknown,
) {
  if (!isPlainObject(value)) {
    return null;
  }

  return parseControlledActionId(
    value.action_id,
  );
}

export function controlledActionRpcErrorStatus(
  message: string,
) {
  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      "authentication required",
    )
  ) {
    return 401;
  }

  if (
    normalized.includes(
      "owner or admin",
    ) ||
    normalized.includes(
      "permission denied",
    ) ||
    normalized.includes(
      "not authorized",
    )
  ) {
    return 403;
  }

  if (
    normalized.includes(
      "not found",
    ) ||
    normalized.includes(
      "does not exist",
    )
  ) {
    return 404;
  }

  if (
    normalized.includes(
      "idempotency",
    ) ||
    normalized.includes(
      "confirmation",
    ) ||
    normalized.includes(
      "expected description",
    ) ||
    normalized.includes(
      "stale",
    ) ||
    normalized.includes(
      "already"
    )
  ) {
    return 409;
  }

  return 500;
}