import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  NextRequest,
} from "next/server";

const mocks =
  vi.hoisted(() => ({
    createServerClient:
      vi.fn(),

    getUser:
      vi.fn(),
  }));

vi.mock(
  "@supabase/ssr",
  () => ({
    createServerClient:
      mocks.createServerClient,
  }),
);

import {
  proxy,
} from "./proxy";

function requestFor(
  pathname: string,
) {
  return new NextRequest(
    `https://proxy.test${pathname}`,
    {
      headers: {
        "x-request-id":
          "request-12345678",
      },
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.getUser
    .mockResolvedValue({
      data: {
        user:
          null,
      },

      error:
        null,
    });

  mocks.createServerClient
    .mockReturnValue({
      auth: {
        getUser:
          mocks.getUser,
      },
    });
});

describe(
  "Midtrans notification proxy exemption",
  () => {

    it(
      "bypasses Supabase authentication for the exact notification path",
      async () => {
        const response =
          await proxy(
            requestFor(
              "/api/billing/midtrans/notification",
            ),
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          response.headers.get(
            "x-request-id",
          ),
        ).toBe(
          "request-12345678",
        );

        expect(
          mocks.createServerClient,
        ).not.toHaveBeenCalled();

        expect(
          mocks.getUser,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "does not exempt a child path beneath the notification endpoint",
      async () => {
        const response =
          await proxy(
            requestFor(
              "/api/billing/midtrans/notification/extra",
            ),
          );

        expect(
          mocks.createServerClient,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.getUser,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          response.status,
        ).toBeGreaterThanOrEqual(
          300,
        );
      },
    );


    it(
      "does not exempt other Midtrans billing API paths",
      async () => {
        const response =
          await proxy(
            requestFor(
              "/api/billing/midtrans/other",
            ),
          );

        expect(
          mocks.createServerClient,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.getUser,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          response.status,
        ).toBeGreaterThanOrEqual(
          300,
        );
      },
    );


    it(
      "does not make the billing checkout endpoint public",
      async () => {
        const response =
          await proxy(
            requestFor(
              "/api/billing/checkout",
            ),
          );

        expect(
          mocks.createServerClient,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.getUser,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          response.status,
        ).toBeGreaterThanOrEqual(
          300,
        );
      },
    );


    it(
      "preserves the existing TikTok Shop webhook exemption",
      async () => {
        const response =
          await proxy(
            requestFor(
              "/api/marketplaces/tiktok-shop/webhook",
            ),
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          mocks.createServerClient,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
