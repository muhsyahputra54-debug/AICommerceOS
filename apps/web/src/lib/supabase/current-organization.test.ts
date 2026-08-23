import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const ORGANIZATION_A =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const ORGANIZATION_B =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const USER_ID =
  "11111111-1111-4111-8111-111111111111";

const mocks =
  vi.hoisted(
    () => {
      const query = {
        select:
          vi.fn(),

        eq:
          vi.fn(),

        order:
          vi.fn(),
      };

      return {
        createClient:
          vi.fn(),

        getUser:
          vi.fn(),

        from:
          vi.fn(),

        query,

        cookieGet:
          vi.fn(),

        queryData:
          [] as unknown[],

        queryError:
          null as {
            message:
              string;
          } | null,
      };
    },
  );

vi.mock(
  "@/lib/supabase/server",
  () => ({
    createClient:
      mocks.createClient,
  }),
);

vi.mock(
  "next/headers",
  () => ({
    cookies:
      vi.fn(
        async () => ({
          get:
            mocks.cookieGet,
        }),
      ),
  }),
);

import {
  getCurrentOrganization,
  getOrganizationMemberships,
} from "./current-organization";

function row(
  organizationId:
    string,
  createdAt:
    string,
) {
  return {
    organization_id:
      organizationId,

    role:
      "owner",

    created_at:
      createdAt,

    organizations: {
      id:
        organizationId,

      name:
        `Organization ${organizationId[0]}`,
    },
  };
}

describe(
  "current organization resolver",
  () => {
    beforeEach(
      () => {
        mocks.createClient
          .mockReset();

        mocks.getUser
          .mockReset();

        mocks.from
          .mockReset();

        mocks.query.select
          .mockReset();

        mocks.query.eq
          .mockReset();

        mocks.query.order
          .mockReset();

        mocks.cookieGet
          .mockReset();

        mocks.queryData =
          [];

        mocks.queryError =
          null;

        mocks.createClient
          .mockResolvedValue({
            auth: {
              getUser:
                mocks.getUser,
            },

            from:
              mocks.from,
          });

        mocks.getUser
          .mockResolvedValue({
            data: {
              user: {
                id:
                  USER_ID,
              },
            },

            error:
              null,
          });

        mocks.from
          .mockReturnValue(
            mocks.query,
          );

        mocks.query.select
          .mockReturnValue(
            mocks.query,
          );

        mocks.query.eq
          .mockReturnValue(
            mocks.query,
          );

        mocks.query.order
          .mockImplementation(
            () => {
              if (
                mocks.query.order.mock
                  .calls.length ===
                1
              ) {
                return mocks.query;
              }

              return Promise.resolve({
                data:
                  mocks.queryData,

                error:
                  mocks.queryError,
              });
            },
          );
      },
    );

    it(
      "returns no memberships for an unauthenticated request",
      async () => {
        mocks.getUser
          .mockResolvedValue({
            data: {
              user:
                null,
            },

            error:
              null,
          });

        await expect(
          getOrganizationMemberships(),
        ).resolves.toEqual(
          [],
        );

        expect(
          mocks.from,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "queries memberships with deterministic ordering",
      async () => {
        mocks.queryData = [
          row(
            ORGANIZATION_B,
            "2026-08-02T00:00:00.000Z",
          ),
          row(
            ORGANIZATION_A,
            "2026-08-01T00:00:00.000Z",
          ),
        ];

        const memberships =
          await getOrganizationMemberships();

        expect(
          mocks.from,
        ).toHaveBeenCalledWith(
          "organization_members",
        );

        expect(
          mocks.query.eq,
        ).toHaveBeenCalledWith(
          "user_id",
          USER_ID,
        );

        expect(
          mocks.query.order,
        ).toHaveBeenNthCalledWith(
          1,
          "created_at",
          {
            ascending:
              true,
          },
        );

        expect(
          mocks.query.order,
        ).toHaveBeenNthCalledWith(
          2,
          "organization_id",
          {
            ascending:
              true,
          },
        );

        expect(
          memberships.map(
            (membership) =>
              membership.organizationId,
          ),
        ).toEqual([
          ORGANIZATION_A,
          ORGANIZATION_B,
        ]);
      },
    );

    it(
      "automatically resolves the only membership without reading the active cookie",
      async () => {
        mocks.queryData = [
          row(
            ORGANIZATION_A,
            "2026-08-01T00:00:00.000Z",
          ),
        ];

        await expect(
          getCurrentOrganization(),
        ).resolves.toEqual({
          organizationId:
            ORGANIZATION_A,

          role:
            "owner",

          organization: {
            id:
              ORGANIZATION_A,

            name:
              "Organization a",
          },
        });

        expect(
          mocks.cookieGet,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns null for multiple memberships without an explicit selection",
      async () => {
        mocks.queryData = [
          row(
            ORGANIZATION_A,
            "2026-08-01T00:00:00.000Z",
          ),
          row(
            ORGANIZATION_B,
            "2026-08-02T00:00:00.000Z",
          ),
        ];

        mocks.cookieGet
          .mockReturnValue(
            undefined,
          );

        await expect(
          getCurrentOrganization(),
        ).resolves.toBeNull();
      },
    );

    it(
      "resolves a persisted organization only after membership validation",
      async () => {
        mocks.queryData = [
          row(
            ORGANIZATION_A,
            "2026-08-01T00:00:00.000Z",
          ),
          row(
            ORGANIZATION_B,
            "2026-08-02T00:00:00.000Z",
          ),
        ];

        mocks.cookieGet
          .mockReturnValue({
            value:
              ORGANIZATION_B,
          });

        await expect(
          getCurrentOrganization(),
        ).resolves.toMatchObject({
          organizationId:
            ORGANIZATION_B,

          role:
            "owner",
        });
      },
    );

    it(
      "fails closed for a stale organization cookie",
      async () => {
        mocks.queryData = [
          row(
            ORGANIZATION_A,
            "2026-08-01T00:00:00.000Z",
          ),
          row(
            ORGANIZATION_B,
            "2026-08-02T00:00:00.000Z",
          ),
        ];

        mocks.cookieGet
          .mockReturnValue({
            value:
              "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          });

        await expect(
          getCurrentOrganization(),
        ).resolves.toBeNull();
      },
    );

    it(
      "propagates membership query failures without inventing an organization",
      async () => {
        mocks.queryError = {
          message:
            "membership-read-failed",
        };

        await expect(
          getOrganizationMemberships(),
        ).rejects.toThrow(
          "membership-read-failed",
        );
      },
    );
  },
);
