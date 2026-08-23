import {
  normalizeActiveOrganizationId,
} from "./active-organization-contract";

export const ORGANIZATION_ONBOARDING_PATH =
  "/onboarding";

export const ORGANIZATION_SELECTION_PATH =
  "/organizations/select";

export const ORGANIZATION_DEFAULT_APP_PATH =
  "/today";

export type OrganizationAccessMembership = {
  organizationId: string;
};

export function resolveOrganizationPageDestination(
  pathname: string,
  memberships: readonly OrganizationAccessMembership[],
  persistedOrganizationId: unknown,
): string | null {
  if (memberships.length === 0) {
    return pathname === ORGANIZATION_ONBOARDING_PATH
      ? null
      : ORGANIZATION_ONBOARDING_PATH;
  }

  if (memberships.length === 1) {
    if (
      pathname === ORGANIZATION_ONBOARDING_PATH ||
      pathname === ORGANIZATION_SELECTION_PATH
    ) {
      return ORGANIZATION_DEFAULT_APP_PATH;
    }

    return null;
  }

  const normalizedPersistedId =
    normalizeActiveOrganizationId(
      persistedOrganizationId,
    );

  const activeMembershipExists =
    normalizedPersistedId !== null &&
    memberships.some(
      (membership) =>
        normalizeActiveOrganizationId(
          membership.organizationId,
        ) === normalizedPersistedId,
    );

  if (!activeMembershipExists) {
    return pathname === ORGANIZATION_SELECTION_PATH
      ? null
      : ORGANIZATION_SELECTION_PATH;
  }

  if (
    pathname === ORGANIZATION_ONBOARDING_PATH ||
    pathname === ORGANIZATION_SELECTION_PATH
  ) {
    return ORGANIZATION_DEFAULT_APP_PATH;
  }

  return null;
}
