import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const USER_ID =
  "11111111-1111-4111-8111-111111111111";

const ORGANIZATION_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const mocks =
  vi.hoisted(
    () => ({
      createClient:
        vi.fn(),

      getUser:
        vi.fn(),

      rpc:
        vi.fn(),

      logServerError:
        vi.fn(),
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

function jsonRequest(
  body:
    unknown,
) {
  return new Request(
    "http://localhost/api/organizations/onboarding",
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
  "POST /api/organizations/onboarding",
  () => {
    beforeEach(
      () => {
        mocks.createClient
          .mockReset();

        mocks.getUser
          .mockReset();

        mocks.rpc
          .mockReset();

        mocks.logServerError
          .mockReset();

        mocks.createClient
          .mockImplementation(
            async () => ({
              auth: {
                getUser:
                  mocks.getUser,
              },

              rpc:
                mocks.rpc,
            }),
          );

        mocks.getUser
          .mockImplementation(
            async () => ({
              data: {
                user: {
                  id:
                    USER_ID,
                },
              },

              error:
                null,
            }),
          );

        mocks.rpc
          .mockImplementation(
            async () => ({
              data:
                ORGANIZATION_ID,

              error:
                null,
            }),
          );
      },
    );

    it(
      "rejects unauthenticated requests",
      async () => {
        mocks.getUser
          .mockImplementation(
            async () => ({
              data: {
                user:
                  null,
              },

              error:
                null,
            }),
          );

        const response =
          await POST(
            jsonRequest({
              name:
                "LAKUVO Store",
            }),
          );

        expect(
          response.status,
        ).toBe(
          401,
        );

        await expect(
          response.json(),
        ).resolves.toMatchObject({
          code:
            "AUTH_REQUIRED",
        });

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects malformed JSON",
      async () => {
        const request =
          new Request(
            "http://localhost/api/organizations/onboarding",
            {
              method:
                "POST",

              headers: {
                "content-type":
                  "application/json",
              },

              body:
                "{",
            },
          );

        const response =
          await POST(
            request,
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

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a valid JSON null body without calling the RPC",
      async () => {
        const response =
          await POST(
            jsonRequest(
              null,
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
            "ORGANIZATION_NAME_REQUIRED",
        });

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a blank organization name",
      async () => {
        const response =
          await POST(
            jsonRequest({
              name:
                "    ",
            }),
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
            "ORGANIZATION_NAME_REQUIRED",
        });

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects names longer than 100 characters",
      async () => {
        const response =
          await POST(
            jsonRequest({
              name:
                "a".repeat(
                  101,
                ),
            }),
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
            "ORGANIZATION_NAME_TOO_LONG",
        });

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "normalizes the name and calls only the controlled RPC",
      async () => {
        const response =
          await POST(
            jsonRequest({
              name:
                "   LAKUVO    Commerce   Store   ",
            }),
          );

        expect(
          response.status,
        ).toBe(
          200,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledWith(
          "create_initial_organization",
          {
            p_name:
              "LAKUVO Commerce Store",
          },
        );

        await expect(
          response.json(),
        ).resolves.toEqual({
          organizationId:
            ORGANIZATION_ID,
        });
      },
    );

    it(
      "fails closed when the RPC fails",
      async () => {
        const rpcError = {
          message:
            "rpc-failed",
        };

        mocks.rpc
          .mockImplementation(
            async () => ({
              data:
                null,

              error:
                rpcError,
            }),
          );

        const response =
          await POST(
            jsonRequest({
              name:
                "LAKUVO Store",
            }),
          );

        expect(
          response.status,
        ).toBe(
          500,
        );

        await expect(
          response.json(),
        ).resolves.toMatchObject({
          code:
            "ORGANIZATION_SETUP_FAILED",
        });

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            event:
              "organization_initial_onboarding_failed",

            operation:
              "create_initial_organization",

            error:
              rpcError,
          }),
        );
      },
    );

    it(
      "fails closed when the RPC returns an invalid organization id",
      async () => {
        mocks.rpc
          .mockImplementation(
            async () => ({
              data:
                "not-an-organization-id",

              error:
                null,
            }),
          );

        const response =
          await POST(
            jsonRequest({
              name:
                "LAKUVO Store",
            }),
          );

        expect(
          response.status,
        ).toBe(
          500,
        );

        await expect(
          response.json(),
        ).resolves.toMatchObject({
          code:
            "ORGANIZATION_SETUP_FAILED",
        });

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            event:
              "organization_initial_onboarding_invalid_result",
          }),
        );
      },
    );
  },
);
