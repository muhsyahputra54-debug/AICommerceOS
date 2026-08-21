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

export type ControlledProductDescriptionProposalInput = {
  productId: string;

  /*
   * Optional only for backward compatibility with the
   * existing description confirmation UI, which predates
   * multi-action proposal routing.
   */
  actionType?: "product.update_description";

  expectedDescription: string | null;
  proposedDescription: string;
  idempotencyKey: string;
};

export type ControlledProductNameProposalInput = {
  actionType: "product.update_name";
  productId: string;
  expectedName: string;
  proposedName: string;
  idempotencyKey: string;
};

export type ControlledProductStatusProposalInput = {
  actionType: "product.update_status";
  productId: string;
  expectedStatus: "active" | "inactive";
  proposedStatus: "active" | "inactive";
  idempotencyKey: string;
};

export type ControlledProductPriceProposalInput = {
  actionType: "product.update_price";
  productId: string;
  expectedPrice: string;
  proposedPrice: string;
  idempotencyKey: string;
};

export type ControlledActionProposalInput =
  | ControlledProductDescriptionProposalInput
  | ControlledProductNameProposalInput
  | ControlledProductStatusProposalInput
  | ControlledProductPriceProposalInput;

type ControlledActionApiRecordBase = {
  id: string;
  contractVersion: 1;
  status: ControlledActionApiStatus;
  targetResource: "product";
  targetId: string;
  createdAt: string;
  confirmedAt: string | null;
  executionStartedAt: string | null;
  finalizedAt: string | null;
  errorMessage: string | null;
};

export type ControlledProductDescriptionActionApiRecord =
  ControlledActionApiRecordBase & {
    actionType: "product.update_description";
    expectedDescription: string | null;
    proposedDescription: string;
  };

export type ControlledProductNameActionApiRecord =
  ControlledActionApiRecordBase & {
    actionType: "product.update_name";
    mutationField: "name";
    expectedName: string;
    proposedName: string;
  };

export type ControlledProductStatusActionApiRecord =
  ControlledActionApiRecordBase & {
    actionType: "product.update_status";
    mutationField: "status";
    expectedStatus: "active" | "inactive";
    proposedStatus: "active" | "inactive";
  };

export type ControlledProductPriceActionApiRecord =
  ControlledActionApiRecordBase & {
    actionType: "product.update_price";
    mutationField: "price";
    expectedPrice: string;
    proposedPrice: string;
  };

export type ControlledActionApiRecord =
  | ControlledProductDescriptionActionApiRecord
  | ControlledProductNameActionApiRecord
  | ControlledProductStatusActionApiRecord
  | ControlledProductPriceActionApiRecord;

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

const DESCRIPTION_PROPOSAL_KEYS =
  new Set([
    "actionType",
    "productId",
    "expectedDescription",
    "proposedDescription",
    "idempotencyKey",
  ]);

const PRODUCT_NAME_PROPOSAL_KEYS =
  new Set([
    "actionType",
    "productId",
    "expectedName",
    "proposedName",
    "idempotencyKey",
  ]);

const PRODUCT_STATUS_PROPOSAL_KEYS =
  new Set([
    "actionType",
    "productId",
    "expectedStatus",
    "proposedStatus",
    "idempotencyKey",
  ]);

const PRODUCT_PRICE_PROPOSAL_KEYS =
  new Set([
    "actionType",
    "productId",
    "expectedPrice",
    "proposedPrice",
    "idempotencyKey",
  ]);

const CANONICAL_PRODUCT_PRICE_PATTERN =
  /^(?:0|[1-9][0-9]{0,9})\.[0-9]{2}$/;

function isCanonicalProductPrice(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    CANONICAL_PRODUCT_PRICE_PATTERN.test(
      value,
    )
  );
}

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

  const actionType =
    value.actionType;

  if (
    actionType !== undefined &&
    actionType !==
      "product.update_description" &&
    actionType !==
      "product.update_name" &&
    actionType !==
      "product.update_status" &&
    actionType !==
      "product.update_price"
  ) {
    return {
      ok: false,
      error:
        "Controlled action type tidak didukung.",
    };
  }

  const isProductNameAction =
    actionType ===
    "product.update_name";

  const isProductStatusAction =
    actionType ===
    "product.update_status";

  const isProductPriceAction =
    actionType ===
    "product.update_price";

  const allowedKeys =
    isProductNameAction
      ? PRODUCT_NAME_PROPOSAL_KEYS
      : isProductStatusAction
        ? PRODUCT_STATUS_PROPOSAL_KEYS
        : isProductPriceAction
          ? PRODUCT_PRICE_PROPOSAL_KEYS
          : DESCRIPTION_PROPOSAL_KEYS;

  const unexpectedKey =
    Object.keys(value).find(
      (key) =>
        !allowedKeys.has(key),
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

  if (isProductNameAction) {
    if (
      typeof value.expectedName !==
      "string"
    ) {
      return {
        ok: false,
        error:
          "Expected product name tidak valid.",
      };
    }

    if (
      typeof value.proposedName !==
      "string"
    ) {
      return {
        ok: false,
        error:
          "Proposed product name tidak valid.",
      };
    }

    const proposedName =
      value.proposedName.trim();

    if (!proposedName) {
      return {
        ok: false,
        error:
          "Proposed product name wajib diisi.",
      };
    }

    if (
      value.expectedName ===
      proposedName
    ) {
      return {
        ok: false,
        error:
          "Proposed product name harus berbeda dari nama saat ini.",
      };
    }

    return {
      ok: true,
      value: {
        actionType:
          "product.update_name",

        productId:
          value.productId,

        /*
         * Preserve the exact authoritative snapshot.
         * Do not trim the expected value.
         */
        expectedName:
          value.expectedName,

        proposedName,

        idempotencyKey,
      },
    };
  }

  if (isProductStatusAction) {
    const expectedStatus =
      value.expectedStatus;

    const proposedStatus =
      value.proposedStatus;

    if (
      expectedStatus !== "active" &&
      expectedStatus !== "inactive"
    ) {
      return {
        ok: false,
        error:
          "Expected product status tidak valid.",
      };
    }

    if (
      proposedStatus !== "active" &&
      proposedStatus !== "inactive"
    ) {
      return {
        ok: false,
        error:
          "Proposed product status tidak valid.",
      };
    }

    if (
      expectedStatus ===
      proposedStatus
    ) {
      return {
        ok: false,
        error:
          "Proposed product status harus berbeda dari status saat ini.",
      };
    }

    return {
      ok: true,
      value: {
        actionType:
          "product.update_status",

        productId:
          value.productId,

        expectedStatus,

        proposedStatus,

        idempotencyKey,
      },
    };
  }

  if (isProductPriceAction) {
    const expectedPrice =
      value.expectedPrice;

    const proposedPrice =
      value.proposedPrice;

    if (
      !isCanonicalProductPrice(
        expectedPrice,
      )
    ) {
      return {
        ok: false,
        error:
          "Expected product price tidak valid.",
      };
    }

    if (
      !isCanonicalProductPrice(
        proposedPrice,
      )
    ) {
      return {
        ok: false,
        error:
          "Proposed product price tidak valid.",
      };
    }

    if (expectedPrice === proposedPrice) {
      return {
        ok: false,
        error:
          "Proposed product price harus berbeda dari harga saat ini.",
      };
    }

    return {
      ok: true,
      value: {
        actionType:
          "product.update_price",

        productId:
          value.productId,

        expectedPrice,

        proposedPrice,

        idempotencyKey,
      },
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

  /*
   * Preserve the old parsed shape for the already-shipped
   * description UI. The optional actionType is intentionally
   * omitted here when using the legacy description path.
   */
  return {
    ok: true,
    value: {
      productId:
        value.productId,

      expectedDescription:
        value.expectedDescription,

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
    !isControlledActionStatus(
      value.status,
    ) ||
    value.target_resource !==
      "product" ||
    !isUuid(value.target_id) ||
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

  const base = {
    id:
      value.id,

    contractVersion:
      1 as const,

    status:
      value.status,

    targetResource:
      "product" as const,

    targetId:
      value.target_id,

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

  if (
    value.action_type ===
    "product.update_description"
  ) {
    if (
      !isNullableString(
        value.expected_description,
      ) ||
      typeof value.proposed_description !==
        "string"
    ) {
      return null;
    }

    return {
      ...base,

      actionType:
        "product.update_description",

      expectedDescription:
        value.expected_description,

      proposedDescription:
        value.proposed_description,
    };
  }

  if (
    value.action_type ===
    "product.update_name"
  ) {
    if (
      value.mutation_field !==
        "name" ||
      typeof value.expected_value !==
        "string" ||
      typeof value.proposed_value !==
        "string" ||
      value.expected_description !==
        null ||
      value.proposed_description !==
        null
    ) {
      return null;
    }

    const proposedName =
      value.proposed_value;

    if (
      !proposedName ||
      proposedName.trim() !==
        proposedName ||
      value.expected_value ===
        proposedName
    ) {
      return null;
    }

    return {
      ...base,

      actionType:
        "product.update_name",

      mutationField:
        "name",

      expectedName:
        value.expected_value,

      proposedName,
    };
  }

  if (
    value.action_type ===
    "product.update_status"
  ) {
    if (
      value.mutation_field !==
        "status" ||
      (
        value.expected_value !==
          "active" &&
        value.expected_value !==
          "inactive"
      ) ||
      (
        value.proposed_value !==
          "active" &&
        value.proposed_value !==
          "inactive"
      ) ||
      value.expected_value ===
        value.proposed_value ||
      value.expected_description !==
        null ||
      value.proposed_description !==
        null
    ) {
      return null;
    }

    return {
      ...base,

      actionType:
        "product.update_status",

      mutationField:
        "status",

      expectedStatus:
        value.expected_value,

      proposedStatus:
        value.proposed_value,
    };
  }

  if (
    value.action_type ===
    "product.update_price"
  ) {
    if (
      value.mutation_field !==
        "price" ||
      !isCanonicalProductPrice(
        value.expected_value,
      ) ||
      !isCanonicalProductPrice(
        value.proposed_value,
      ) ||
      value.expected_value ===
        value.proposed_value ||
      value.expected_description !==
        null ||
      value.proposed_description !==
        null
    ) {
      return null;
    }

    return {
      ...base,

      actionType:
        "product.update_price",

      mutationField:
        "price",

      expectedPrice:
        value.expected_value,

      proposedPrice:
        value.proposed_value,
    };
  }

  return null;
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
      "product name changed",
    ) ||
    normalized.includes(
      "does not change the current name",
    ) ||
    normalized.includes(
      "product status changed",
    ) ||
    normalized.includes(
      "does not change the current status",
    ) ||
    normalized.includes(
      "product price changed",
    ) ||
    normalized.includes(
      "does not change the current price",
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
