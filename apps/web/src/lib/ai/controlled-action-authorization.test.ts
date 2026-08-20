import {
  describe,
  expect,
  it,
} from "vitest";

import {
  authorizeControlledProductDescriptionExecution,
  CONTROLLED_ACTION_EXECUTION_ROLES,
} from "./controlled-action-authorization";

import {
  projectControlledProductDescriptionProposal,
} from "./controlled-action-contract";

function proposal() {
  const result =
    projectControlledProductDescriptionProposal({
      organizationId:
        "org-1",

      requestedByUserId:
        "user-1",

      productId:
        "product-1",

      currentDescription:
        "Current description",

      proposedDescription:
        "Improved description",
    });

  if (!result.ok) {
    throw new Error(
      "Expected valid proposal.",
    );
  }

  return result.proposal;
}

function ownerActor() {
  return {
    organizationId:
      "org-1",

    userId:
      "user-1",

    role:
      "owner",
  };
}

function confirmation() {
  return {
    confirmed:
      true,

    confirmedByUserId:
      "user-1",
  };
}

describe(
  "controlled action authorization",
  () => {
    it(
      "allowlists owner and admin only",
      () => {
        expect(
          CONTROLLED_ACTION_EXECUTION_ROLES,
        ).toEqual([
          "owner",
          "admin",
        ]);
      },
    );

    it(
      "authorizes an explicitly confirmed owner",
      () => {
        const result =
          authorizeControlledProductDescriptionExecution({
            proposal:
              proposal(),

            actor:
              ownerActor(),

            confirmation:
              confirmation(),
          });

        expect(result.ok).toBe(true);

        if (!result.ok) {
          return;
        }

        expect(
          result.plan.authorization,
        ).toEqual({
          role:
            "owner",

          policy:
            "owner_or_admin",

          explicitHumanConfirmation:
            true,
        });
      },
    );

    it(
      "authorizes an explicitly confirmed admin",
      () => {
        const result =
          authorizeControlledProductDescriptionExecution({
            proposal:
              proposal(),

            actor: {
              ...ownerActor(),

              role:
                "admin",
            },

            confirmation:
              confirmation(),
          });

        expect(result.ok).toBe(true);

        if (!result.ok) {
          return;
        }

        expect(
          result.plan.authorization.role,
        ).toBe("admin");
      },
    );

    it(
      "rejects a member",
      () => {
        expect(
          authorizeControlledProductDescriptionExecution({
            proposal:
              proposal(),

            actor: {
              ...ownerActor(),

              role:
                "member",
            },

            confirmation:
              confirmation(),
          }),
        ).toEqual({
          ok: false,
          reason:
            "role_not_authorized",
        });
      },
    );

    it(
      "rejects an unknown role",
      () => {
        expect(
          authorizeControlledProductDescriptionExecution({
            proposal:
              proposal(),

            actor: {
              ...ownerActor(),

              role:
                "superadmin",
            },

            confirmation:
              confirmation(),
          }),
        ).toEqual({
          ok: false,
          reason:
            "role_not_authorized",
        });
      },
    );

    it(
      "rejects invalid actor references",
      () => {
        expect(
          authorizeControlledProductDescriptionExecution({
            proposal:
              proposal(),

            actor: {
              ...ownerActor(),

              userId:
                " ",
            },

            confirmation:
              confirmation(),
          }),
        ).toEqual({
          ok: false,
          reason:
            "invalid_actor",
        });
      },
    );

    it(
      "rejects cross-organization execution",
      () => {
        expect(
          authorizeControlledProductDescriptionExecution({
            proposal:
              proposal(),

            actor: {
              ...ownerActor(),

              organizationId:
                "org-2",
            },

            confirmation:
              confirmation(),
          }),
        ).toEqual({
          ok: false,
          reason:
            "organization_mismatch",
        });
      },
    );

    it(
      "requires the requesting user",
      () => {
        expect(
          authorizeControlledProductDescriptionExecution({
            proposal:
              proposal(),

            actor: {
              ...ownerActor(),

              userId:
                "user-2",
            },

            confirmation: {
              confirmed:
                true,

              confirmedByUserId:
                "user-2",
            },
          }),
        ).toEqual({
          ok: false,
          reason:
            "requester_mismatch",
        });
      },
    );

    it(
      "requires an explicit confirmation event",
      () => {
        expect(
          authorizeControlledProductDescriptionExecution({
            proposal:
              proposal(),

            actor:
              ownerActor(),

            confirmation: {
              ...confirmation(),

              confirmed:
                false,
            },
          }),
        ).toEqual({
          ok: false,
          reason:
            "confirmation_required",
        });
      },
    );

    it(
      "requires confirmation by the authenticated actor",
      () => {
        expect(
          authorizeControlledProductDescriptionExecution({
            proposal:
              proposal(),

            actor:
              ownerActor(),

            confirmation: {
              confirmed:
                true,

              confirmedByUserId:
                "user-2",
            },
          }),
        ).toEqual({
          ok: false,
          reason:
            "confirmer_mismatch",
        });
      },
    );

    it(
      "preserves the exact before value for compare-and-set",
      () => {
        const created =
          projectControlledProductDescriptionProposal({
            organizationId:
              "org-1",

            requestedByUserId:
              "user-1",

            productId:
              "product-1",

            currentDescription:
              "  Exact old value  ",

            proposedDescription:
              "New value",
          });

        if (!created.ok) {
          throw new Error(
            "Expected valid proposal.",
          );
        }

        const result =
          authorizeControlledProductDescriptionExecution({
            proposal:
              created.proposal,

            actor:
              ownerActor(),

            confirmation:
              confirmation(),
          });

        expect(result.ok).toBe(true);

        if (!result.ok) {
          return;
        }

        expect(
          result.plan.mutation.expectedValue,
        ).toBe(
          "  Exact old value  ",
        );

        expect(
          result.plan.mutation.concurrency,
        ).toBe(
          "exact_compare_and_set",
        );
      },
    );

    it(
      "supports null as the exact previous description",
      () => {
        const created =
          projectControlledProductDescriptionProposal({
            organizationId:
              "org-1",

            requestedByUserId:
              "user-1",

            productId:
              "product-1",

            currentDescription:
              null,

            proposedDescription:
              "New value",
          });

        if (!created.ok) {
          throw new Error(
            "Expected valid proposal.",
          );
        }

        const result =
          authorizeControlledProductDescriptionExecution({
            proposal:
              created.proposal,

            actor:
              ownerActor(),

            confirmation:
              confirmation(),
          });

        expect(result.ok).toBe(true);

        if (!result.ok) {
          return;
        }

        expect(
          result.plan.mutation.expectedValue,
        ).toBeNull();
      },
    );

    it(
      "plans only the description mutation",
      () => {
        const result =
          authorizeControlledProductDescriptionExecution({
            proposal:
              proposal(),

            actor:
              ownerActor(),

            confirmation:
              confirmation(),
          });

        expect(result.ok).toBe(true);

        if (!result.ok) {
          return;
        }

        expect(
          result.plan.mutation,
        ).toEqual({
          resource:
            "product",

          productId:
            "product-1",

          field:
            "description",

          expectedValue:
            "Current description",

          nextValue:
            "Improved description",

          concurrency:
            "exact_compare_and_set",

          staleTargetPolicy:
            "reject",
        });

        expect(
          result.plan.safeguards,
        ).toEqual({
          idempotencyRequired:
            true,

          atomicMutationRequired:
            true,

          proposalAuthorizesExecution:
            false,
        });
      },
    );
  },
);
