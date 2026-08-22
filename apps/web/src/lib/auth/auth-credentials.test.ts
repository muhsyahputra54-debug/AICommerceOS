import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MIN_AUTH_PASSWORD_LENGTH,
  normalizeAuthEmail,
  validateSignInCredentials,
  validateSignUpCredentials,
} from "./auth-credentials";

describe(
  "auth credentials",
  () => {
    it(
      "uses an eight-character signup minimum",
      () => {
        expect(
          MIN_AUTH_PASSWORD_LENGTH,
        ).toBe(8);
      },
    );

    it(
      "trims email input without changing its case",
      () => {
        expect(
          normalizeAuthEmail(
            "  Seller@Example.com  ",
          ),
        ).toBe(
          "Seller@Example.com",
        );
      },
    );

    it.each([
      {
        input: {
          email: "",
          password: "secret",
        },
        error: "email_required",
      },
      {
        input: {
          email: "seller",
          password: "secret",
        },
        error: "email_invalid",
      },
      {
        input: {
          email:
            "seller@example.com",
          password: "",
        },
        error: "password_required",
      },
    ] as const)(
      "rejects invalid sign-in credentials",
      ({ input, error }) => {
        expect(
          validateSignInCredentials(
            input,
          ),
        ).toBe(error);
      },
    );

    it(
      "accepts valid sign-in credentials",
      () => {
        expect(
          validateSignInCredentials({
            email:
              " seller@example.com ",
            password: "secret",
          }),
        ).toBeNull();
      },
    );

    it(
      "rejects a signup password below the minimum",
      () => {
        expect(
          validateSignUpCredentials({
            email:
              "seller@example.com",
            password: "short",
            confirmPassword:
              "short",
          }),
        ).toBe(
          "password_too_short",
        );
      },
    );

    it(
      "rejects mismatched signup passwords",
      () => {
        expect(
          validateSignUpCredentials({
            email:
              "seller@example.com",
            password:
              "long-enough-password",
            confirmPassword:
              "different-password",
          }),
        ).toBe(
          "password_mismatch",
        );
      },
    );

    it(
      "accepts valid signup credentials",
      () => {
        expect(
          validateSignUpCredentials({
            email:
              " seller@example.com ",
            password:
              "long-enough-password",
            confirmPassword:
              "long-enough-password",
          }),
        ).toBeNull();
      },
    );
  },
);