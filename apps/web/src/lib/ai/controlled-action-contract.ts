export const CONTROLLED_ACTION_CONTRACT_VERSION =
  1 as const;

export const CONTROLLED_ACTION_TYPES = [
  "product.update_description",
  "product.update_name",
  "product.update_status",
] as const;

export type ControlledActionType =
  (typeof CONTROLLED_ACTION_TYPES)[number];

export type ControlledProductDescriptionProposal = {
  contractVersion: 1;

  actionType:
    "product.update_description";

  risk:
    "low_reversible";

  organizationId:
    string;

  requestedByUserId:
    string;

  target: {
    resource:
      "product";

    productId:
      string;
  };

  preview: {
    before: {
      description:
        string | null;
    };

    after: {
      description:
        string;
    };
  };

  allowedMutationFields:
    readonly ["description"];

  safeguards: {
    serverAuthorizationRequired:
      true;

    explicitHumanConfirmationRequired:
      true;

    humanConfirmed:
      false;

    idempotencyRequired:
      true;

    optimisticConcurrencyRequired:
      true;

    staleTargetPolicy:
      "reject";

    proposalAuthorizesExecution:
      false;
  };
};

export type ControlledActionProposalResult =
  | {
      ok: true;

      proposal:
        ControlledProductDescriptionProposal;
    }
  | {
      ok: false;

      reason:
        | "invalid_input"
        | "organization_required"
        | "user_required"
        | "product_required"
        | "current_description_invalid"
        | "proposed_description_required"
        | "no_change"
        | "unsupported_field";
    };

const ALLOWED_PROPOSAL_INPUT_FIELDS =
  new Set([
    "organizationId",
    "requestedByUserId",
    "productId",
    "currentDescription",
    "proposedDescription",
  ]);

function asRecord(
  value: unknown,
) {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<
    string,
    unknown
  >;
}

function normalizedReference(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  if (
    !normalized ||
    normalized.length > 256
  ) {
    return null;
  }

  return normalized;
}

export function projectControlledProductDescriptionProposal(
  value: unknown,
): ControlledActionProposalResult {
  const record =
    asRecord(
      value,
    );

  if (!record) {
    return {
      ok: false,
      reason:
        "invalid_input",
    };
  }

  for (
    const field of
      Object.keys(record)
  ) {
    if (
      !ALLOWED_PROPOSAL_INPUT_FIELDS.has(
        field,
      )
    ) {
      return {
        ok: false,
        reason:
          "unsupported_field",
      };
    }
  }

  const organizationId =
    normalizedReference(
      record.organizationId,
    );

  if (!organizationId) {
    return {
      ok: false,
      reason:
        "organization_required",
    };
  }

  const requestedByUserId =
    normalizedReference(
      record.requestedByUserId,
    );

  if (!requestedByUserId) {
    return {
      ok: false,
      reason:
        "user_required",
    };
  }

  const productId =
    normalizedReference(
      record.productId,
    );

  if (!productId) {
    return {
      ok: false,
      reason:
        "product_required",
    };
  }

  const currentDescription =
    record.currentDescription;

  if (
    currentDescription !== null &&
    typeof currentDescription !==
      "string"
  ) {
    return {
      ok: false,
      reason:
        "current_description_invalid",
    };
  }

  if (
    typeof record.proposedDescription !==
    "string"
  ) {
    return {
      ok: false,
      reason:
        "proposed_description_required",
    };
  }

  const proposedDescription =
    record.proposedDescription.trim();

  if (!proposedDescription) {
    return {
      ok: false,
      reason:
        "proposed_description_required",
    };
  }

  const normalizedCurrent =
    currentDescription === null
      ? null
      : currentDescription.trim();

  if (
    normalizedCurrent ===
    proposedDescription
  ) {
    return {
      ok: false,
      reason:
        "no_change",
    };
  }

  return {
    ok: true,

    proposal: {
      contractVersion:
        CONTROLLED_ACTION_CONTRACT_VERSION,

      actionType:
        "product.update_description",

      risk:
        "low_reversible",

      organizationId,

      requestedByUserId,

      target: {
        resource:
          "product",

        productId,
      },

      preview: {
        before: {
          description:
            currentDescription,
        },

        after: {
          description:
            proposedDescription,
        },
      },

      allowedMutationFields: [
        "description",
      ],

      safeguards: {
        serverAuthorizationRequired:
          true,

        explicitHumanConfirmationRequired:
          true,

        humanConfirmed:
          false,

        idempotencyRequired:
          true,

        optimisticConcurrencyRequired:
          true,

        staleTargetPolicy:
          "reject",

        proposalAuthorizesExecution:
          false,
      },
    },
  };
}
