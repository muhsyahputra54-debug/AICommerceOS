import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks =
  vi.hoisted(() => ({
    logServerError:
      vi.fn(),
  }));

vi.mock(
  "@/lib/observability/server-logger",
  () => ({
    logServerError:
      mocks.logServerError,
  }),
);

import {
  logControlledActionFailure,
} from "./controlled-action-observability";

beforeEach(() => {
  mocks.logServerError
    .mockReset();
});

describe(
  "controlled action observability",
  () => {
    it.each([
      {
        operation:
          "propose" as const,
        event:
          "ai_controlled_action_proposal_failed",
        route:
          "/api/ai/controlled-actions",
        loggedOperation:
          "propose_controlled_action",
      },
      {
        operation:
          "confirm" as const,
        event:
          "ai_controlled_action_confirmation_failed",
        route:
          "/api/ai/controlled-actions/[id]/confirm",
        loggedOperation:
          "confirm_controlled_action",
      },
      {
        operation:
          "execute" as const,
        event:
          "ai_controlled_action_execution_failed",
        route:
          "/api/ai/controlled-actions/[id]/execute",
        loggedOperation:
          "execute_controlled_action",
      },
    ])(
      "logs $operation failures with bounded metadata",
      ({
        operation,
        event,
        route,
        loggedOperation,
      }) => {
        const error =
          new Error(
            "database failure",
          );

        logControlledActionFailure({
          operation,
          requestId:
            "req-test-123",
          error,
        });

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledWith({
          event,
          requestId:
            "req-test-123",
          route,
          method:
            "POST",
          provider:
            "supabase",
          operation:
            loggedOperation,
          error,
        });
      },
    );

    it(
      "does not require action, user, organization, or idempotency identifiers",
      () => {
        const error =
          new Error(
            "failure",
          );

        logControlledActionFailure({
          operation:
            "execute",
          error,
        });

        const input =
          mocks.logServerError
            .mock.calls[0]?.[0];

        expect(
          input,
        ).toEqual(
          expect.objectContaining({
            requestId:
              null,
            error,
          }),
        );

        expect(
          input,
        ).not.toHaveProperty(
          "actionId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "userId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "organizationId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "idempotencyKey",
        );
      },
    );
  },
);