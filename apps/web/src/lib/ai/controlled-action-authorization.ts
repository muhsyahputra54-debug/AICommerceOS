import type {
  ControlledProductDescriptionProposal,
} from "./controlled-action-contract";

export const CONTROLLED_ACTION_EXECUTION_ROLES = [
  "owner",
  "admin",
] as const;

export type ControlledActionExecutionRole =
  (typeof CONTROLLED_ACTION_EXECUTION_ROLES)[number];

export type ControlledActionServerActor = {
  organizationId: string;
  userId: string;
  role: string;
};

export type ControlledActionConfirmation = {
  confirmed: boolean;
  confirmedByUserId: string;
};

export type ControlledProductDescriptionExecutionPlan = {
  contractVersion: 1;

  actionType:
    "product.update_description";

  organizationId:
    string;

  requestedByUserId:
    string;

  confirmedByUserId:
    string;

  authorization: {
    role:
      ControlledActionExecutionRole;

    policy:
      "owner_or_admin";

    explicitHumanConfirmation:
      true;
  };

  mutation: {
    resource:
      "product";

    productId:
      string;

    field:
      "description";

    expectedValue:
      string | null;

    nextValue:
      string;

    concurrency:
      "exact_compare_and_set";

    staleTargetPolicy:
      "reject";
  };

  safeguards: {
    idempotencyRequired:
      true;

    atomicMutationRequired:
      true;

    proposalAuthorizesExecution:
      false;
  };
};

export type ControlledActionAuthorizationResult =
  | {
      ok: true;

      plan:
        ControlledProductDescriptionExecutionPlan;
    }
  | {
      ok: false;

      reason:
        | "invalid_actor"
        | "role_not_authorized"
        | "organization_mismatch"
        | "requester_mismatch"
        | "confirmation_required"
        | "confirmer_mismatch";
    };

function normalizedReference(
  value: string,
) {
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

function authorizedRole(
  value: string,
): ControlledActionExecutionRole | null {
  const normalized =
    value.trim().toLowerCase();

  if (
    normalized === "owner" ||
    normalized === "admin"
  ) {
    return normalized;
  }

  return null;
}

export function authorizeControlledProductDescriptionExecution({
  proposal,
  actor,
  confirmation,
}: {
  proposal:
    ControlledProductDescriptionProposal;

  actor:
    ControlledActionServerActor;

  confirmation:
    ControlledActionConfirmation;
}): ControlledActionAuthorizationResult {
  const organizationId =
    normalizedReference(
      actor.organizationId,
    );

  const userId =
    normalizedReference(
      actor.userId,
    );

  if (
    !organizationId ||
    !userId
  ) {
    return {
      ok: false,
      reason:
        "invalid_actor",
    };
  }

  const role =
    authorizedRole(
      actor.role,
    );

  if (!role) {
    return {
      ok: false,
      reason:
        "role_not_authorized",
    };
  }

  if (
    proposal.organizationId !==
    organizationId
  ) {
    return {
      ok: false,
      reason:
        "organization_mismatch",
    };
  }

  if (
    proposal.requestedByUserId !==
    userId
  ) {
    return {
      ok: false,
      reason:
        "requester_mismatch",
    };
  }

  if (!confirmation.confirmed) {
    return {
      ok: false,
      reason:
        "confirmation_required",
    };
  }

  const confirmedByUserId =
    normalizedReference(
      confirmation.confirmedByUserId,
    );

  if (
    !confirmedByUserId ||
    confirmedByUserId !== userId
  ) {
    return {
      ok: false,
      reason:
        "confirmer_mismatch",
    };
  }

  return {
    ok: true,

    plan: {
      contractVersion:
        proposal.contractVersion,

      actionType:
        proposal.actionType,

      organizationId,

      requestedByUserId:
        proposal.requestedByUserId,

      confirmedByUserId,

      authorization: {
        role,

        policy:
          "owner_or_admin",

        explicitHumanConfirmation:
          true,
      },

      mutation: {
        resource:
          "product",

        productId:
          proposal.target.productId,

        field:
          "description",

        expectedValue:
          proposal.preview.before.description,

        nextValue:
          proposal.preview.after.description,

        concurrency:
          "exact_compare_and_set",

        staleTargetPolicy:
          "reject",
      },

      safeguards: {
        idempotencyRequired:
          true,

        atomicMutationRequired:
          true,

        proposalAuthorizesExecution:
          false,
      },
    },
  };
}
