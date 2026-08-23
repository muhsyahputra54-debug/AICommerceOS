import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const USER_ID =
  "11111111-1111-4111-8111-111111111111";

const ORGANIZATION_A =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const ORGANIZATION_B =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const ORGANIZATION_C =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const mocks =
  vi.hoisted(
    () => ({
      createClient:
        vi.fn(),
      getUser:
        vi.fn(),
      from:
        vi.fn(),
      select:
        vi.fn(),
      eq:
        vi.fn(),
      logServerError:
        vi.fn(),
      membershipRows:
        [] as Array<{
          organization_id:
            string;
        }>,
      membershipError:
        null as {
          message:
            string;
        } | null,
    }),
  );

vi.mock(
  "@/lib/supabase/server",
  () => ({
    createClient:
      mocks.createClient,
  }),
);

vi.mock(
  "@/lib/observability/server-logger",
  () => ({
    logServerError:
      mocks.logServerError,
  }),
);

import {
  POST,
} from "./route";

function request(
  body: unknown,
) {
  return new Request(
    "http://localhost/api/organizations/active",
    {
      method:
        "POST",
      headers: {
        "content-type":
          "application/json",
        "x-request-id":
          "request-12345678",
      },
      body:
        JSON.stringify(
          body,
        ),
    },
  );
}

describe(
  "POST /api/organizations/active",
  () => {
    beforeEach(
      () => {
        mocks.createClient
          .mockReset();
        mocks.getUser
          .mockReset();
        mocks.from
          .mockReset();
        mocks.select
          .mockReset();
        mocks.eq
          .mockReset();
        mocks.logServerError
          .mockReset();

        mocks.membershipRows =
          [];
        mocks.membershipError =
          null;

        const query = {
          select:
            mocks.select,
          eq:
            mocks.eq,
        };

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
            query,
          );

        mocks.select
          .mockReturnValue(
            query,
          );

        mocks.eq
          .mockImplementation(
            async () => ({
              data:
                mocks.membershipRows,
              error:
                mocks.membershipError,
            }),
          );
      },
    );

    it(
      "rejects unauthenticated requests",
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

        const response =
          await POST(
            request({
              organizationId:
                ORGANIZATION_A,
            }),
          );

        expect(
          response.status,
        ).toBe(
          401,
        );

        expect(
          mocks.from,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects malformed JSON",
      async () => {
        const response =
          await POST(
            new Request(
              "http://localhost/api/organizations/active",
              {
                method:
                  "POST",
                body:
                  "{",
              },
            ),
          );

        expect(
          response.status,
        ).toBe(
          400,
        );

        await expect(
          response.json(),
        ).resolves.toMatchObject({
          code:
            "INVALID_JSON",
        });
      },
    );

    it.each([
      null,
      {},
      {
        organizationId:
          "invalid",
      },
    ])(
      "rejects invalid organization id input",
      async (body) => {
        const response =
          await POST(
            request(
              body,
            ),
          );

        expect(
          response.status,
        ).toBe(
          400,
        );

        await expect(
          response.json(),
        ).resolves.toMatchObject({
          code:
            "INVALID_ORGANIZATION_ID",
        });

        expect(
          mocks.from,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "requires onboarding when no memberships exist",
      async () => {
        mocks.membershipRows =
          [];

        const response =
          await POST(
            request({
              organizationId:
                ORGANIZATION_A,
            }),
          );

        expect(
          response.status,
        ).toBe(
          409,
        );

        await expect(
          response.json(),
        ).resolves.toMatchObject({
          code:
            "ONBOARDING_REQUIRED",
        });
      },
    );

    it(
      "does not set an active cookie for a single membership",
      async () => {
        mocks.membershipRows = [
          {
            organization_id:
              ORGANIZATION_A,
          },
        ];

        const response =
          await POST(
            request({
              organizationId:
                ORGANIZATION_A,
            }),
          );

        expect(
          response.status,
        ).toBe(
          409,
        );

        await expect(
          response.json(),
        ).resolves.toMatchObject({
          code:
            "SELECTION_NOT_REQUIRED",
        });

        expect(
          response.cookies.get(
            "lakuvo_active_organization_id",
          ),
        ).toBeUndefined();
      },
    );

    it(
      "rejects a valid UUID that is not one of the user's memberships",
      async () => {
        mocks.membershipRows = [
          {
            organization_id:
              ORGANIZATION_A,
          },
          {
            organization_id:
              ORGANIZATION_B,
          },
        ];

        const response =
          await POST(
            request({
              organizationId:
                ORGANIZATION_C,
            }),
          );

        expect(
          response.status,
        ).toBe(
          403,
        );

        await expect(
          response.json(),
        ).resolves.toMatchObject({
          code:
            "ORGANIZATION_ACCESS_DENIED",
        });

        expect(
          response.cookies.get(
            "lakuvo_active_organization_id",
          ),
        ).toBeUndefined();
      },
    );

    it(
      "fails closed when membership loading fails",
      async () => {
        const membershipError = {
          message:
            "membership-read-failed",
        };

        mocks.membershipError =
          membershipError;

        const response =
          await POST(
            request({
              organizationId:
                ORGANIZATION_A,
            }),
          );

        expect(
          response.status,
        ).toBe(
          500,
        );

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            event:
              "organization_active_membership_read_failed",
            error:
              membershipError,
          }),
        );
      },
    );

    it(
      "sets the HTTP-only active organization cookie only after multi-org membership validation",
      async () => {
        mocks.membershipRows = [
          {
            organization_id:
              ORGANIZATION_A,
          },
          {
            organization_id:
              ORGANIZATION_B,
          },
        ];

        const response =
          await POST(
            request({
              organizationId:
                ORGANIZATION_B,
            }),
          );

        expect(
          response.status,
        ).toBe(
          200,
        );

        await expect(
          response.json(),
        ).resolves.toEqual({
          organizationId:
            ORGANIZATION_B,
        });

        expect(
          response.cookies.get(
            "lakuvo_active_organization_id",
          )?.value,
        ).toBe(
          ORGANIZATION_B,
        );

        expect(
          response.headers.get(
            "set-cookie",
          ),
        ).toContain(
          "HttpOnly",
        );

        expect(
          response.headers.get(
            "set-cookie",
          ),
        ).toContain(
          "SameSite=lax",
        );
      },
    );
  },
);
