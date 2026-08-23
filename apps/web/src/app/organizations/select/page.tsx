import {
  redirect,
} from "next/navigation";

import {
  OrganizationSelector,
} from "@/components/organizations/OrganizationSelector";
import {
  getPersistedActiveOrganizationId,
  resolveActiveOrganizationMembership,
} from "@/lib/supabase/active-organization";
import {
  getOrganizationMemberships,
} from "@/lib/supabase/current-organization";

export default async function OrganizationSelectionPage() {
  const memberships =
    await getOrganizationMemberships();

  if (memberships.length === 0) {
    redirect(
      "/onboarding",
    );
  }

  if (memberships.length === 1) {
    redirect(
      "/today",
    );
  }

  const persistedOrganizationId =
    await getPersistedActiveOrganizationId();

  const activeMembership =
    resolveActiveOrganizationMembership(
      memberships,
      persistedOrganizationId,
    );

  if (activeMembership) {
    redirect(
      "/today",
    );
  }

  return (
    <OrganizationSelector
      organizations={
        memberships.map(
          (membership) => ({
            organizationId:
              membership.organizationId,
            name:
              membership.organization?.name ??
              "Workspace",
            role:
              membership.role,
          }),
        )
      }
    />
  );
}
