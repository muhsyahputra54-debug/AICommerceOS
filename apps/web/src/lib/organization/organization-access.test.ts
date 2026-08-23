import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ORGANIZATION_DEFAULT_APP_PATH,
  ORGANIZATION_ONBOARDING_PATH,
  ORGANIZATION_SELECTION_PATH,
  resolveOrganizationPageDestination,
} from "./organization-access";

const ORGANIZATION_A =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const ORGANIZATION_B =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const ORGANIZATION_C =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function membership(
  organizationId: string,
) {
  return {
    organizationId,
  };
}

describe(
  "organization page access resolver",
  () => {
    it(
      "routes a zero-membership user to onboarding",
      () => {
        expect(
          resolveOrganizationPageDestination(
            "/today",
            [],
            null,
          ),
        ).toBe(
          ORGANIZATION_ONBOARDING_PATH,
        );
      },
    );

    it(
      "allows a zero-membership user to remain on onboarding",
      () => {
        expect(
          resolveOrganizationPageDestination(
            ORGANIZATION_ONBOARDING_PATH,
            [],
            null,
          ),
        ).toBeNull();
      },
    );

    it(
      "does not allow a zero-membership user to stay on selection",
      () => {
        expect(
          resolveOrganizationPageDestination(
            ORGANIZATION_SELECTION_PATH,
            [],
            null,
          ),
        ).toBe(
          ORGANIZATION_ONBOARDING_PATH,
        );
      },
    );

    it(
      "auto-activates a single membership without a cookie",
      () => {
        expect(
          resolveOrganizationPageDestination(
            "/today",
            [
              membership(
                ORGANIZATION_A,
              ),
            ],
            null,
          ),
        ).toBeNull();
      },
    );

    it.each([
      ORGANIZATION_ONBOARDING_PATH,
      ORGANIZATION_SELECTION_PATH,
    ])(
      "routes a single-membership user away from %s",
      (pathname) => {
        expect(
          resolveOrganizationPageDestination(
            pathname,
            [
              membership(
                ORGANIZATION_A,
              ),
            ],
            null,
          ),
        ).toBe(
          ORGANIZATION_DEFAULT_APP_PATH,
        );
      },
    );

    it(
      "requires selection for multiple memberships without a cookie",
      () => {
        expect(
          resolveOrganizationPageDestination(
            "/today",
            [
              membership(
                ORGANIZATION_A,
              ),
              membership(
                ORGANIZATION_B,
              ),
            ],
            null,
          ),
        ).toBe(
          ORGANIZATION_SELECTION_PATH,
        );
      },
    );

    it(
      "requires selection for a stale multi-org cookie",
      () => {
        expect(
          resolveOrganizationPageDestination(
            "/products",
            [
              membership(
                ORGANIZATION_A,
              ),
              membership(
                ORGANIZATION_B,
              ),
            ],
            ORGANIZATION_C,
          ),
        ).toBe(
          ORGANIZATION_SELECTION_PATH,
        );
      },
    );

    it(
      "allows unresolved multi-org users to remain on the selection page",
      () => {
        expect(
          resolveOrganizationPageDestination(
            ORGANIZATION_SELECTION_PATH,
            [
              membership(
                ORGANIZATION_A,
              ),
              membership(
                ORGANIZATION_B,
              ),
            ],
            null,
          ),
        ).toBeNull();
      },
    );

    it(
      "allows a valid persisted multi-org selection",
      () => {
        expect(
          resolveOrganizationPageDestination(
            "/products",
            [
              membership(
                ORGANIZATION_A,
              ),
              membership(
                ORGANIZATION_B,
              ),
            ],
            ORGANIZATION_B,
          ),
        ).toBeNull();
      },
    );

    it.each([
      ORGANIZATION_ONBOARDING_PATH,
      ORGANIZATION_SELECTION_PATH,
    ])(
      "routes resolved multi-org users away from %s",
      (pathname) => {
        expect(
          resolveOrganizationPageDestination(
            pathname,
            [
              membership(
                ORGANIZATION_A,
              ),
              membership(
                ORGANIZATION_B,
              ),
            ],
            ORGANIZATION_B,
          ),
        ).toBe(
          ORGANIZATION_DEFAULT_APP_PATH,
        );
      },
    );
  },
);
