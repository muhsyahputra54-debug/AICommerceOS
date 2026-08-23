export const ACTIVE_ORGANIZATION_COOKIE =
  "lakuvo_active_organization_id";

export const ACTIVE_ORGANIZATION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const ORGANIZATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function normalizeActiveOrganizationId(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim().toLowerCase();

  if (!ORGANIZATION_ID_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}
