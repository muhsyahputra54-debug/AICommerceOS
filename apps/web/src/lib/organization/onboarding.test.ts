import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MAX_INITIAL_ORGANIZATION_NAME_LENGTH,
  normalizeInitialOrganizationName,
  validateInitialOrganizationName,
} from "./onboarding";

describe(
  "initial organization onboarding validation",
  () => {
    it(
      "uses the locked 100-character maximum",
      () => {
        expect(
          MAX_INITIAL_ORGANIZATION_NAME_LENGTH,
        ).toBe(
          100,
        );
      },
    );

    it.each([
      undefined,
      null,
      "",
      " ",
      " \t \n ",
      123,
      {},
    ])(
      "rejects missing organization name %s",
      (value) => {
        expect(
          validateInitialOrganizationName(
            value,
          ),
        ).toEqual({
          ok:
            false,

          error:
            "name_required",
        });
      },
    );

    it(
      "trims and collapses whitespace",
      () => {
        expect(
          normalizeInitialOrganizationName(
            "   LAKUVO    Commerce \n Store   ",
          ),
        ).toBe(
          "LAKUVO Commerce Store",
        );

        expect(
          validateInitialOrganizationName(
            "   LAKUVO    Commerce \n Store   ",
          ),
        ).toEqual({
          ok:
            true,

          name:
            "LAKUVO Commerce Store",
        });
      },
    );

    it(
      "accepts exactly 100 characters",
      () => {
        const name =
          "a".repeat(
            100,
          );

        expect(
          validateInitialOrganizationName(
            name,
          ),
        ).toEqual({
          ok:
            true,

          name,
        });
      },
    );

    it(
      "rejects more than 100 characters",
      () => {
        expect(
          validateInitialOrganizationName(
            "a".repeat(
              101,
            ),
          ),
        ).toEqual({
          ok:
            false,

          error:
            "name_too_long",
        });
      },
    );

    it(
      "counts Unicode code points rather than UTF-16 code units",
      () => {
        expect(
          validateInitialOrganizationName(
            "🚀".repeat(
              100,
            ),
          ).ok,
        ).toBe(
          true,
        );

        expect(
          validateInitialOrganizationName(
            "🚀".repeat(
              101,
            ),
          ),
        ).toEqual({
          ok:
            false,

          error:
            "name_too_long",
        });
      },
    );
  },
);
