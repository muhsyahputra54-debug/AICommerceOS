import {
  cookies,
} from "next/headers";

export const ACTIVE_ORGANIZATION_COOKIE =
  "lakuvo_active_organization_id";

export const ACTIVE_ORGANIZATION_COOKIE_OPTIONS = {
  httpOnly:
    true,
  sameSite:
    "lax" as const,
  secure:
    process.env.NODE_ENV ===
    "production",
  path:
    "/",
};

const ORGANIZATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type OrganizationSummary = {
  id:
    string;

  name:
    string;
};

export type OrganizationMembership = {
  organizationId:
    string;

  role:
    string;

  createdAt:
    string;

  organization:
    OrganizationSummary | null;
};

export function normalizeActiveOrganizationId(
  value:
    unknown,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    !ORGANIZATION_ID_PATTERN.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized;
}

export function orderOrganizationMemberships(
  memberships:
    readonly OrganizationMembership[],
): OrganizationMembership[] {
  return [
    ...memberships,
  ].sort(
    (
      left,
      right,
    ) => {
      const createdAtOrder =
        left.createdAt.localeCompare(
          right.createdAt,
        );

      if (
        createdAtOrder !==
        0
      ) {
        return createdAtOrder;
      }

      return left.organizationId.localeCompare(
        right.organizationId,
      );
    },
  );
}

export function resolveActiveOrganizationMembership(
  memberships:
    readonly OrganizationMembership[],
  persistedOrganizationId:
    unknown,
): OrganizationMembership | null {
  const orderedMemberships =
    orderOrganizationMemberships(
      memberships,
    );

  if (
    orderedMemberships.length ===
    0
  ) {
    return null;
  }

  if (
    orderedMemberships.length ===
    1
  ) {
    return (
      orderedMemberships[0] ??
      null
    );
  }

  const normalizedOrganizationId =
    normalizeActiveOrganizationId(
      persistedOrganizationId,
    );

  if (
    !normalizedOrganizationId
  ) {
    return null;
  }

  return (
    orderedMemberships.find(
      (membership) =>
        membership.organizationId
          .toLowerCase() ===
        normalizedOrganizationId,
    ) ??
    null
  );
}

export async function getPersistedActiveOrganizationId():
Promise<string | null> {
  const cookieStore =
    await cookies();

  return normalizeActiveOrganizationId(
    cookieStore.get(
      ACTIVE_ORGANIZATION_COOKIE,
    )?.value,
  );
}
