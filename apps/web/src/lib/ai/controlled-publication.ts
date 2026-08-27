export const CONTROLLED_PUBLICATION_ACTION_TYPE =
  "content.publish_text" as const;

export const CONTROLLED_PUBLICATION_TARGET_RESOURCE =
  "marketplace_authorized_shop" as const;

export const CONTROLLED_PUBLICATION_MUTATION_FIELD =
  "content" as const;

export const CONTROLLED_PUBLICATION_STATUSES = [
  "proposed",
  "confirmed",
  "stale",
] as const;

export type ControlledPublicationStatus =
  (typeof CONTROLLED_PUBLICATION_STATUSES)[number];

export const CONTROLLED_PUBLICATION_MAX_CONTENT_LENGTH =
  5000 as const;

export const CONTROLLED_PUBLICATION_MAX_IDEMPOTENCY_KEY_LENGTH =
  128 as const;

/*
 * SG4 deliberately stops before provider execution.
 * SG5 must add a separately reviewed deterministic executor.
 */
export const CONTROLLED_PUBLICATION_EXTERNAL_EXECUTION_ENABLED =
  false as const;

export type ControlledPublicationProposalInput = {
  actionType:
    typeof CONTROLLED_PUBLICATION_ACTION_TYPE;

  authorizedShopId:
    string;

  content:
    string;

  idempotencyKey:
    string;
};

export type ControlledPublicationRecord = {
  id:
    string;

  contractVersion:
    1;

  actionType:
    typeof CONTROLLED_PUBLICATION_ACTION_TYPE;

  status:
    ControlledPublicationStatus;

  targetResource:
    typeof CONTROLLED_PUBLICATION_TARGET_RESOURCE;

  targetId:
    string;

  mutationField:
    typeof CONTROLLED_PUBLICATION_MUTATION_FIELD;

  expectedValue:
    null;

  proposedValue:
    string;

  destination: {
    provider:
      string;

    externalShopId:
      string;

    name:
      string;
  };

  requestedByUserId:
    string;

  confirmedByUserId:
    string | null;

  createdAt:
    string;

  confirmedAt:
    string | null;

  finalizedAt:
    string | null;

  errorMessage:
    string | null;
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
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const IDEMPOTENCY_KEY_PATTERN =
  /^[A-Za-z0-9._:-]+$/;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizedNonBlankString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  return normalized
    ? normalized
    : null;
}

function nullableString(
  value: unknown,
): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

function requiredUuid(
  value: unknown,
): string | null {
  const normalized =
    normalizedNonBlankString(
      value,
    );

  if (
    !normalized ||
    !UUID_PATTERN.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized.toLowerCase();
}

function isControlledPublicationStatus(
  value: unknown,
): value is ControlledPublicationStatus {
  return (
    typeof value === "string" &&
    (
      CONTROLLED_PUBLICATION_STATUSES as
        readonly string[]
    ).includes(
      value,
    )
  );
}

export function normalizeControlledPublicationContent(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value
      .replace(/\r\n?/g, "\n")
      .trim();

  if (
    !normalized ||
    normalized.length >
      CONTROLLED_PUBLICATION_MAX_CONTENT_LENGTH
  ) {
    return null;
  }

  return normalized;
}

export function normalizeControlledPublicationIdempotencyKey(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  if (
    normalized.length < 8 ||
    normalized.length >
      CONTROLLED_PUBLICATION_MAX_IDEMPOTENCY_KEY_LENGTH ||
    !IDEMPOTENCY_KEY_PATTERN.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized;
}

export function parseControlledPublicationProposal(
  value: unknown,
): ParseResult<ControlledPublicationProposalInput> {
  if (!isRecord(value)) {
    return {
      ok: false,
      error:
        "Controlled publication payload tidak valid.",
    };
  }

  if (
    value.actionType !==
    CONTROLLED_PUBLICATION_ACTION_TYPE
  ) {
    return {
      ok: false,
      error:
        "Controlled publication action type tidak didukung.",
    };
  }

  const authorizedShopId =
    requiredUuid(
      value.authorizedShopId,
    );

  if (!authorizedShopId) {
    return {
      ok: false,
      error:
        "Authorized shop ID tidak valid.",
    };
  }

  const content =
    normalizeControlledPublicationContent(
      value.content,
    );

  if (!content) {
    return {
      ok: false,
      error:
        "Publication content tidak valid.",
    };
  }

  const idempotencyKey =
    normalizeControlledPublicationIdempotencyKey(
      value.idempotencyKey,
    );

  if (!idempotencyKey) {
    return {
      ok: false,
      error:
        "Controlled publication idempotency key tidak valid.",
    };
  }

  return {
    ok: true,
    value: {
      actionType:
        CONTROLLED_PUBLICATION_ACTION_TYPE,

      authorizedShopId,

      content,

      idempotencyKey,
    },
  };
}

export function projectControlledPublicationRecord(
  value: unknown,
): ControlledPublicationRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.contract_version !== 1 ||
    value.action_type !==
      CONTROLLED_PUBLICATION_ACTION_TYPE ||
    value.target_resource !==
      CONTROLLED_PUBLICATION_TARGET_RESOURCE ||
    value.mutation_field !==
      CONTROLLED_PUBLICATION_MUTATION_FIELD ||
    value.expected_value !== null ||
    !isControlledPublicationStatus(
      value.status,
    )
  ) {
    return null;
  }

  const id =
    requiredUuid(
      value.id,
    );

  const targetId =
    requiredUuid(
      value.target_id,
    );

  const requestedByUserId =
    requiredUuid(
      value.requested_by_user_id,
    );

  const confirmedByUserId =
    value.confirmed_by_user_id === null
      ? null
      : requiredUuid(
          value.confirmed_by_user_id,
        );

  const proposedValue =
    normalizeControlledPublicationContent(
      value.proposed_value,
    );

  const provider =
    normalizedNonBlankString(
      value.provider,
    );

  const externalShopId =
    normalizedNonBlankString(
      value.external_shop_id,
    );

  const destinationName =
    normalizedNonBlankString(
      value.destination_name,
    );

  const createdAt =
    normalizedNonBlankString(
      value.created_at,
    );

  const confirmedAt =
    nullableString(
      value.confirmed_at,
    );

  const finalizedAt =
    nullableString(
      value.finalized_at,
    );

  const errorMessage =
    nullableString(
      value.error_message,
    );

  if (
    !id ||
    !targetId ||
    !requestedByUserId ||
    (
      value.confirmed_by_user_id !== null &&
      !confirmedByUserId
    ) ||
    !proposedValue ||
    !provider ||
    provider !== provider.toLowerCase() ||
    !externalShopId ||
    !destinationName ||
    !createdAt ||
    confirmedAt === undefined ||
    finalizedAt === undefined ||
    errorMessage === undefined
  ) {
    return null;
  }

  if (
    value.status === "proposed" &&
    (
      confirmedByUserId !== null ||
      confirmedAt !== null ||
      finalizedAt !== null ||
      errorMessage !== null
    )
  ) {
    return null;
  }

  if (
    value.status === "confirmed" &&
    (
      confirmedByUserId === null ||
      confirmedAt === null ||
      finalizedAt !== null ||
      errorMessage !== null
    )
  ) {
    return null;
  }

  if (
    value.status === "stale" &&
    finalizedAt === null
  ) {
    return null;
  }

  return {
    id,

    contractVersion:
      1,

    actionType:
      CONTROLLED_PUBLICATION_ACTION_TYPE,

    status:
      value.status,

    targetResource:
      CONTROLLED_PUBLICATION_TARGET_RESOURCE,

    targetId,

    mutationField:
      CONTROLLED_PUBLICATION_MUTATION_FIELD,

    expectedValue:
      null,

    proposedValue,

    destination: {
      provider,

      externalShopId,

      name:
        destinationName,
    },

    requestedByUserId,

    confirmedByUserId,

    createdAt,

    confirmedAt,

    finalizedAt,

    errorMessage,
  };
}

export type ControlledPublicationWorkflowOperation =
  "confirm";

export function controlledPublicationWorkflowOperation(
  status: ControlledPublicationStatus,
): ControlledPublicationWorkflowOperation | null {
  if (status === "proposed") {
    return "confirm";
  }

  return null;
}

export function controlledPublicationCanExecute(
  status: ControlledPublicationStatus,
): false {
  if (
    !CONTROLLED_PUBLICATION_STATUSES.includes(
      status,
    )
  ) {
    return false;
  }

  return false;
}