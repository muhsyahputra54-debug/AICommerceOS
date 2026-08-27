import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildGrowthPublicationIdempotencyKey,
  controlledPublicationCanConfirm,
  controlledPublicationCanExecuteInSg4,
} from "./controlled-publication-ui";

const SHOP_ID =
  "22222222-2222-4222-8222-222222222222";

describe(
  "controlled publication UI safety",
  () => {
    it(
      "permits only explicit confirmation for a proposed publication",
      () => {
        expect(
          controlledPublicationCanConfirm(
            "proposed",
          ),
        ).toBe(
          true,
        );

        expect(
          controlledPublicationCanConfirm(
            "confirmed",
          ),
        ).toBe(
          false,
        );

        expect(
          controlledPublicationCanConfirm(
            "stale",
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      "never exposes execution in SG4",
      () => {
        for (
          const status of [
            "proposed",
            "confirmed",
            "stale",
          ] as const
        ) {
          expect(
            controlledPublicationCanExecuteInSg4(
              status,
            ),
          ).toBe(
            false,
          );
        }
      },
    );

    it(
      "builds deterministic bounded idempotency keys",
      async () => {
        const first =
          await buildGrowthPublicationIdempotencyKey(
            SHOP_ID,
            "Caption siap ditinjau.",
          );

        const replay =
          await buildGrowthPublicationIdempotencyKey(
            SHOP_ID,
            "Caption siap ditinjau.",
          );

        const changed =
          await buildGrowthPublicationIdempotencyKey(
            SHOP_ID,
            "Caption yang berbeda.",
          );

        expect(
          first,
        ).toMatch(
          /^growth\.[a-f0-9]{64}$/,
        );

        expect(
          replay,
        ).toBe(
          first,
        );

        expect(
          changed,
        ).not.toBe(
          first,
        );

        expect(
          first!.length,
        ).toBeLessThanOrEqual(
          128,
        );
      },
    );

    it(
      "rejects blank publication material",
      async () => {
        await expect(
          buildGrowthPublicationIdempotencyKey(
            SHOP_ID,
            "   ",
          ),
        ).resolves.toBeNull();

        await expect(
          buildGrowthPublicationIdempotencyKey(
            " ",
            "Caption",
          ),
        ).resolves.toBeNull();
      },
    );
  },
);