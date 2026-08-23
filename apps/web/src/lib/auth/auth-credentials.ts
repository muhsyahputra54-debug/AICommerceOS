export const MIN_AUTH_PASSWORD_LENGTH =
  8;

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export type SignInValidationError =
  | "email_required"
  | "email_invalid"
  | "password_required";

export type SignUpValidationError =
  | SignInValidationError
  | "password_too_short"
  | "password_mismatch";

export function normalizeAuthEmail(
  value: string,
) {
  return value.trim();
}

export function validateSignInCredentials(
  input: {
    email: string;
    password: string;
  },
): SignInValidationError | null {
  const email =
    normalizeAuthEmail(
      input.email,
    );

  if (!email) {
    return "email_required";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "email_invalid";
  }

  if (!input.password) {
    return "password_required";
  }

  return null;
}

export function validateSignUpCredentials(
  input: {
    email: string;
    password: string;
    confirmPassword: string;
  },
): SignUpValidationError | null {
  const signInError =
    validateSignInCredentials({
      email: input.email,
      password: input.password,
    });

  if (signInError) {
    return signInError;
  }

  if (
    input.password.length <
    MIN_AUTH_PASSWORD_LENGTH
  ) {
    return "password_too_short";
  }

  if (
    input.password !==
    input.confirmPassword
  ) {
    return "password_mismatch";
  }

  return null;
}
export type NewPasswordValidationError =
  | "password_required"
  | "password_too_short"
  | "password_mismatch";

export function validateNewPassword(
  input: {
    password: string;
    confirmPassword: string;
  },
): NewPasswordValidationError | null {
  if (!input.password) {
    return "password_required";
  }

  if (
    input.password.length <
    MIN_AUTH_PASSWORD_LENGTH
  ) {
    return "password_too_short";
  }

  if (
    input.password !==
    input.confirmPassword
  ) {
    return "password_mismatch";
  }

  return null;
}
