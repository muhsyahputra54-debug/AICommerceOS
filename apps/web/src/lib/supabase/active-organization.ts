import {
  cookies,
} from "next/headers";

import {
  ACTIVE_ORGANIZATION_COOKIE,
  ACTIVE_ORGANIZATION_COOKIE_OPTIONS,
  normalizeActiveOrganizationId,
} from "@/lib/organization/active-organization-contract";

export {
  ACTIVE_ORGANIZATION_COOKIE,
  ACTIVE_ORGANIZATION_COOKIE_OPTIONS,
  normalizeActiveOrganizationId,
};

export type OrganizationSummary = {
  id: string;
  name: string;
};

export type OrganizationMembership = {
  organizationId: string;
  role: string;
  createdAt: string;
  organization: OrganizationSummary | null;
};

export function orderOrganizationMemberships(
  memberships: readonly OrganizationMembership[],
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

      if (createdAtOrder !== 0) {
        return createdAtOrder;
      }

      return left.organizationId.localeCompare(
        right.organizationId,
      );
    },
  );
}

export function resolveActiveOrganizationMembership(
  memberships: readonly OrganizationMembership[],
  persistedOrganizationId: unknown,
): OrganizationMembership | null {
  const orderedMemberships =
    orderOrganizationMemberships(
      memberships,
    );

  if (orderedMemberships.length === 0) {
    return null;
  }

  if (orderedMemberships.length === 1) {
    return (
      orderedMemberships[0] ??
      null
    );
  }

  const normalizedOrganizationId =
    normalizeActiveOrganizationId(
      persistedOrganizationId,
    );

  if (!normalizedOrganizationId) {
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
