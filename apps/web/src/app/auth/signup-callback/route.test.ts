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
    `http://localhost/auth/signup-callback${query}`,
    {
      headers: {
        "x-request-id": "request-12345678",
      },
    },
  );
}

describe("GET /auth/signup-callback", () => {
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
        "http://localhost/login?error=missing_signup_code",
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
    "logs and redirects when signup code exchange fails",
    async () => {
      const exchangeError = {
        message: "exchange-failed",
      };

      mocks.exchangeCodeForSession.mockResolvedValue({
        error: exchangeError,
      });

      const response =
        await GET(
          request("?code=signup-code"),
        );

      expect(
        mocks.exchangeCodeForSession,
      ).toHaveBeenCalledWith(
        "signup-code",
      );

      expect(
        mocks.logServerError,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          event:
            "signup_callback_exchange_failed",
          operation:
            "exchange_code_for_session",
          error: exchangeError,
        }),
      );

      expect(
        response.headers.get("location"),
      ).toBe(
        "http://localhost/login?error=signup_callback_failed",
      );

      expect(
        mocks.rpc,
      ).not.toHaveBeenCalled();
    },
  );

  it(
    "preserves a safe internal post-auth destination after signup confirmation",
    async () => {
      const response =
        await GET(
          request(
            "?code=signup-code&redirectedFrom=%2Fproducts%3Fstatus%3Dactive",
          ),
        );

      expect(
        response.headers.get("location"),
      ).toBe(
        "http://localhost/products?status=active",
      );

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
            "?code=signup-code&redirectedFrom=%2F%2Fevil.example",
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
