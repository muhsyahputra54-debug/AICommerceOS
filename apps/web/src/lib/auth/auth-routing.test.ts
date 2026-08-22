import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DEFAULT_POST_AUTH_PATH,
  isGuestOnlyAuthPath,
  isPublicAuthPath,
  resolveSafePostAuthPath,
} from "./auth-routing";

describe(
  "auth routing foundation",
  () => {
    it(
      "uses TODAY as the default authenticated destination",
      () => {
        expect(
          DEFAULT_POST_AUTH_PATH,
        ).toBe("/today");
      },
    );

    it.each([
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/auth",
      "/auth/callback",
      "/auth/recovery",
    ])(
      "allows public auth route %s",
      (pathname) => {
        expect(
          isPublicAuthPath(pathname),
        ).toBe(true);
      },
    );

    it.each([
      "/",
      "/today",
      "/products",
      "/api/ai/chat",
      "/authentication",
    ])(
      "does not classify %s as a public auth route",
      (pathname) => {
        expect(
          isPublicAuthPath(pathname),
        ).toBe(false);
      },
    );

    it(
      "keeps only login and signup guest-only",
      () => {
        expect(
          isGuestOnlyAuthPath(
            "/login",
          ),
        ).toBe(true);

        expect(
          isGuestOnlyAuthPath(
            "/signup",
          ),
        ).toBe(true);

        expect(
          isGuestOnlyAuthPath(
            "/forgot-password",
          ),
        ).toBe(false);

        expect(
          isGuestOnlyAuthPath(
            "/reset-password",
          ),
        ).toBe(false);

        expect(
          isGuestOnlyAuthPath(
            "/auth/recovery",
          ),
        ).toBe(false);
      },
    );

    it.each([
      "/today",
      "/products",
      "/products?status=active",
      "/ai/action-center",
      "/marketplaces/tiktok-shop",
    ])(
      "accepts safe internal destination %s",
      (value) => {
        expect(
          resolveSafePostAuthPath(
            value,
          ),
        ).toBe(value);
      },
    );

    it.each([
      undefined,
      null,
      "",
      "today",
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/auth",
      "/auth/callback",
      "/auth/recovery",
    ])(
      "fails closed for invalid destination %s",
      (value) => {
        expect(
          resolveSafePostAuthPath(
            value,
          ),
        ).toBe(
          DEFAULT_POST_AUTH_PATH,
        );
      },
    );

    it(
      "rejects oversized redirect values",
      () => {
        expect(
          resolveSafePostAuthPath(
            `/${"a".repeat(2048)}`,
          ),
        ).toBe(
          DEFAULT_POST_AUTH_PATH,
        );
      },
    );

    it(
      "rejects control characters",
      () => {
        expect(
          resolveSafePostAuthPath(
            "/today\u0000evil",
          ),
        ).toBe(
          DEFAULT_POST_AUTH_PATH,
        );
      },
    );
  },
);