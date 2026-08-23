import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ACTIVE_ORGANIZATION_COOKIE,
  ACTIVE_ORGANIZATION_COOKIE_OPTIONS,
  normalizeActiveOrganizationId,
  orderOrganizationMemberships,
  resolveActiveOrganizationMembership,
  type OrganizationMembership,
} from "./active-organization";

const ORGANIZATION_A =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const ORGANIZATION_B =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function membership(
  organizationId:
    string,
  createdAt:
    string,
): OrganizationMembership {
  return {
    organizationId,

    role:
      "owner",

    createdAt,

    organization: {
      id:
        organizationId,

      name:
        `Organization ${organizationId[0]}`,
    },
  };
}

describe(
  "active organization core",
  () => {
    it(
      "uses the locked server-only cookie contract",
      () => {
        expect(
          ACTIVE_ORGANIZATION_COOKIE,
        ).toBe(
          "lakuvo_active_organization_id",
        );

        expect(
          ACTIVE_ORGANIZATION_COOKIE_OPTIONS,
        ).toMatchObject({
          httpOnly:
            true,
          sameSite:
            "lax",
          path:
            "/",
        });

        expect(
          ACTIVE_ORGANIZATION_COOKIE_OPTIONS
            .secure,
        ).toBe(
          process.env.NODE_ENV ===
            "production",
        );
      },
    );

    it.each([
      undefined,
      null,
      "",
      "not-a-uuid",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa",
      "aaaaaaaa-aaaa-6aaa-8aaa-aaaaaaaaaaaa",
    ])(
      "rejects invalid active organization id %s",
      (value) => {
        expect(
          normalizeActiveOrganizationId(
            value,
          ),
        ).toBeNull();
      },
    );

    it(
      "normalizes a valid organization id",
      () => {
        expect(
          normalizeActiveOrganizationId(
            `  ${ORGANIZATION_A.toUpperCase()}  `,
          ),
        ).toBe(
          ORGANIZATION_A,
        );
      },
    );

    it(
      "orders memberships deterministically by created time and organization id",
      () => {
        const result =
          orderOrganizationMemberships([
            membership(
              ORGANIZATION_B,
              "2026-08-02T00:00:00.000Z",
            ),
            membership(
              ORGANIZATION_B,
              "2026-08-01T00:00:00.000Z",
            ),
            membership(
              ORGANIZATION_A,
              "2026-08-01T00:00:00.000Z",
            ),
          ]);

        expect(
          result.map(
            (item) =>
              item.organizationId,
          ),
        ).toEqual([
          ORGANIZATION_A,
          ORGANIZATION_B,
          ORGANIZATION_B,
        ]);
      },
    );

    it(
      "returns null when the user has no memberships",
      () => {
        expect(
          resolveActiveOrganizationMembership(
            [],
            null,
          ),
        ).toBeNull();
      },
    );

    it(
      "automatically activates the only membership without requiring a cookie",
      () => {
        const onlyMembership =
          membership(
            ORGANIZATION_A,
            "2026-08-01T00:00:00.000Z",
          );

        expect(
          resolveActiveOrganizationMembership(
            [
              onlyMembership,
            ],
            null,
          ),
        ).toEqual(
          onlyMembership,
        );

        expect(
          resolveActiveOrganizationMembership(
            [
              onlyMembership,
            ],
            ORGANIZATION_B,
          ),
        ).toEqual(
          onlyMembership,
        );
      },
    );

    it(
      "requires an explicit valid selection when multiple memberships exist",
      () => {
        const memberships = [
          membership(
            ORGANIZATION_A,
            "2026-08-01T00:00:00.000Z",
          ),
          membership(
            ORGANIZATION_B,
            "2026-08-02T00:00:00.000Z",
          ),
        ];

        expect(
          resolveActiveOrganizationMembership(
            memberships,
            null,
          ),
        ).toBeNull();

        expect(
          resolveActiveOrganizationMembership(
            memberships,
            "invalid",
          ),
        ).toBeNull();
      },
    );

    it(
      "selects only a persisted organization that is still a membership",
      () => {
        const memberships = [
          membership(
            ORGANIZATION_A,
            "2026-08-01T00:00:00.000Z",
          ),
          membership(
            ORGANIZATION_B,
            "2026-08-02T00:00:00.000Z",
          ),
        ];

        expect(
          resolveActiveOrganizationMembership(
            memberships,
            ORGANIZATION_B,
          )?.organizationId,
        ).toBe(
          ORGANIZATION_B,
        );

        expect(
          resolveActiveOrganizationMembership(
            memberships,
            "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          ),
        ).toBeNull();
      },
    );
  },
);
