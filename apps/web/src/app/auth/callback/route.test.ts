import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  rpc: vi.fn(),
  logServerError: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/observability/server-logger", () => ({
  logServerError: mocks.logServerError,
}));

import { GET } from "./route";

function request(query: string) {
  return new Request(
    `http://localhost/auth/callback${query}`,
    {
      headers: {
        "x-request-id": "request-12345678",
      },
    },
  );
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    mocks.createClient.mockReset();
    mocks.exchangeCodeForSession.mockReset();
    mocks.rpc.mockReset();
    mocks.logServerError.mockReset();

    mocks.createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession:
          mocks.exchangeCodeForSession,
      },
      rpc: mocks.rpc,
    });

    mocks.exchangeCodeForSession.mockResolvedValue({
      error: null,
    });
  });

  it(
    "redirects missing-code requests to login without exchanging a session",
    async () => {
      const response =
        await GET(request(""));

      expect(
        response.headers.get("location"),
      ).toBe(
        "http://localhost/login?error=missing_code",
      );

      expect(
        mocks.createClient,
      ).not.toHaveBeenCalled();

      expect(
        mocks.exchangeCodeForSession,
      ).not.toHaveBeenCalled();

      expect(
        mocks.rpc,
      ).not.toHaveBeenCalled();
    },
  );

  it(
    "logs and redirects when code exchange fails",
    async () => {
      const exchangeError = {
        message: "exchange-failed",
      };

      mocks.exchangeCodeForSession.mockResolvedValue({
        error: exchangeError,
      });

      const response =
        await GET(
          request("?code=oauth-code"),
        );

      expect(
        mocks.exchangeCodeForSession,
      ).toHaveBeenCalledWith(
        "oauth-code",
      );

      expect(
        mocks.logServerError,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          event:
            "auth_callback_exchange_failed",
          operation:
            "exchange_code_for_session",
          error: exchangeError,
        }),
      );

      expect(
        response.headers.get("location"),
      ).toBe(
        "http://localhost/login?error=auth_callback_failed",
      );

      expect(
        mocks.rpc,
      ).not.toHaveBeenCalled();
    },
  );

  it(
    "preserves a safe internal post-auth destination after session exchange",
    async () => {
      const response =
        await GET(
          request(
            "?code=oauth-code&redirectedFrom=%2Fproducts%3Fstatus%3Dactive",
          ),
        );

      expect(
        response.headers.get("location"),
      ).toBe(
        "http://localhost/products?status=active",
      );

      expect(
        mocks.exchangeCodeForSession,
      ).toHaveBeenCalledTimes(1);

      expect(
        mocks.rpc,
      ).not.toHaveBeenCalled();
    },
  );

  it(
    "fails closed to TODAY for an unsafe post-auth destination",
    async () => {
      const response =
        await GET(
          request(
            "?code=oauth-code&redirectedFrom=https%3A%2F%2Fevil.example",
          ),
        );

      expect(
        response.headers.get("location"),
      ).toBe(
        "http://localhost/today",
      );

      expect(
        mocks.rpc,
      ).not.toHaveBeenCalled();
    },
  );
});
