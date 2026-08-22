export const DEFAULT_POST_AUTH_PATH =
  "/today";

const MAX_REDIRECT_PATH_LENGTH =
  2048;

const PUBLIC_AUTH_PATHS =
  new Set([
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ]);

const GUEST_ONLY_AUTH_PATHS =
  new Set([
    "/login",
    "/signup",
  ]);

const BLOCKED_REDIRECT_PATHS =
  new Set([
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ]);

export function isPublicAuthPath(
  pathname: string,
) {
  return (
    PUBLIC_AUTH_PATHS.has(pathname) ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/")
  );
}

export function isGuestOnlyAuthPath(
  pathname: string,
) {
  return GUEST_ONLY_AUTH_PATHS.has(
    pathname,
  );
}

export function resolveSafePostAuthPath(
  value: unknown,
) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length >
      MAX_REDIRECT_PATH_LENGTH
  ) {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001F\u007F]/u.test(
      value,
    )
  ) {
    return DEFAULT_POST_AUTH_PATH;
  }

  let parsed: URL;

  try {
    parsed =
      new URL(
        value,
        "https://lakuvo.invalid",
      );
  } catch {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (
    parsed.origin !==
      "https://lakuvo.invalid"
  ) {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (
    BLOCKED_REDIRECT_PATHS.has(
      parsed.pathname,
    ) ||
    parsed.pathname === "/auth" ||
    parsed.pathname.startsWith(
      "/auth/",
    )
  ) {
    return DEFAULT_POST_AUTH_PATH;
  }

  return (
    parsed.pathname +
    parsed.search
  );
}