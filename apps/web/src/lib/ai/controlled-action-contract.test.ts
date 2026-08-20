import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CONTROLLED_ACTION_CONTRACT_VERSION,
  CONTROLLED_ACTION_TYPES,
  projectControlledProductDescriptionProposal,
} from "./controlled-action-contract";

function validInput() {
  return {
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
  };
}

describe(
  "controlled action contract",
  () => {
    it(
      "allowlists only the first controlled action",
      () => {
        expect(
          CONTROLLED_ACTION_TYPES,
        ).toEqual([
          "product.update_description",
        ]);

        expect(
          CONTROLLED_ACTION_CONTRACT_VERSION,
        ).toBe(1);
      },
    );

    it(
      "projects a safe product description proposal",
      () => {
        const result =
          projectControlledProductDescriptionProposal(
            validInput(),
          );

        expect(result.ok).toBe(true);

        if (!result.ok) {
          return;
        }

        expect(
          result.proposal,
        ).toMatchObject({
          contractVersion: 1,

          actionType:
            "product.update_description",

          risk:
            "low_reversible",

          organizationId:
            "org-1",

          requestedByUserId:
            "user-1",

          target: {
            resource:
              "product",

            productId:
              "product-1",
          },

          allowedMutationFields: [
            "description",
          ],
        });
      },
    );

    it(
      "keeps exact before snapshot",
      () => {
        const input =
          validInput();

        input.currentDescription =
          "  Existing text  ";

        const result =
          projectControlledProductDescriptionProposal(
            input,
          );

        expect(result.ok).toBe(true);

        if (!result.ok) {
          return;
        }

        expect(
          result.proposal.preview.before.description,
        ).toBe(
          "  Existing text  ",
        );

        expect(
          result.proposal.preview.after.description,
        ).toBe(
          "Improved description",
        );
      },
    );

    it(
      "supports null current description",
      () => {
        const result =
          projectControlledProductDescriptionProposal({
            ...validInput(),

            currentDescription:
              null,
          });

        expect(result.ok).toBe(true);

        if (!result.ok) {
          return;
        }

        expect(
          result.proposal.preview.before.description,
        ).toBeNull();
      },
    );

    it(
      "requires organization scope",
      () => {
        expect(
          projectControlledProductDescriptionProposal({
            ...validInput(),

            organizationId:
              " ",
          }),
        ).toEqual({
          ok: false,
          reason:
            "organization_required",
        });
      },
    );

    it(
      "requires requesting user",
      () => {
        expect(
          projectControlledProductDescriptionProposal({
            ...validInput(),

            requestedByUserId:
              "",
          }),
        ).toEqual({
          ok: false,
          reason:
            "user_required",
        });
      },
    );

    it(
      "requires product target",
      () => {
        expect(
          projectControlledProductDescriptionProposal({
            ...validInput(),

            productId:
              "",
          }),
        ).toEqual({
          ok: false,
          reason:
            "product_required",
        });
      },
    );

    it(
      "requires valid current description",
      () => {
        expect(
          projectControlledProductDescriptionProposal({
            ...validInput(),

            currentDescription:
              123,
          }),
        ).toEqual({
          ok: false,
          reason:
            "current_description_invalid",
        });
      },
    );

    it(
      "requires proposed description",
      () => {
        expect(
          projectControlledProductDescriptionProposal({
            ...validInput(),

            proposedDescription:
              "   ",
          }),
        ).toEqual({
          ok: false,
          reason:
            "proposed_description_required",
        });
      },
    );

    it(
      "rejects no-op changes",
      () => {
        expect(
          projectControlledProductDescriptionProposal({
            ...validInput(),

            currentDescription:
              "Same text",

            proposedDescription:
              "  Same text  ",
          }),
        ).toEqual({
          ok: false,
          reason:
            "no_change",
        });
      },
    );

    it(
      "rejects price",
      () => {
        expect(
          projectControlledProductDescriptionProposal({
            ...validInput(),

            price:
              999,
          }),
        ).toEqual({
          ok: false,
          reason:
            "unsupported_field",
        });
      },
    );

    it(
      "rejects stock",
      () => {
        expect(
          projectControlledProductDescriptionProposal({
            ...validInput(),

            stock:
              25,
          }),
        ).toEqual({
          ok: false,
          reason:
            "unsupported_field",
        });
      },
    );

    it(
      "proposal never authorizes execution",
      () => {
        const result =
          projectControlledProductDescriptionProposal(
            validInput(),
          );

        expect(result.ok).toBe(true);

        if (!result.ok) {
          return;
        }

        expect(
          result.proposal.safeguards,
        ).toEqual({
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
        });
      },
    );
  },
);
