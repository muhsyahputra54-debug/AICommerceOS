import {
  getPersistedActiveOrganizationId,
  orderOrganizationMemberships,
  resolveActiveOrganizationMembership,
  type OrganizationMembership,
  type OrganizationSummary,
} from "@/lib/supabase/active-organization";
import {
  createClient,
} from "@/lib/supabase/server";

type OrganizationRelation =
  OrganizationSummary
  | OrganizationSummary[]
  | null;

type OrganizationMembershipRow = {
  organization_id:
    string;

  role:
    string;

  created_at:
    string;

  organizations:
    OrganizationRelation;
};

function normalizeOrganizationRelation(
  value:
    OrganizationRelation,
): OrganizationSummary | null {
  if (
    Array.isArray(
      value,
    )
  ) {
    return (
      value[0] ??
      null
    );
  }

  return value;
}

function mapOrganizationMembership(
  row:
    OrganizationMembershipRow,
): OrganizationMembership {
  return {
    organizationId:
      row.organization_id,

    role:
      row.role,

    createdAt:
      row.created_at,

    organization:
      normalizeOrganizationRelation(
        row.organizations,
      ),
  };
}

export async function getOrganizationMemberships():
Promise<OrganizationMembership[]> {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabase.auth.getUser();

  if (
    userError
  ) {
    throw new Error(
      userError.message,
    );
  }

  if (
    !user
  ) {
    return [];
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "organization_members",
      )
      .select(
        `
          organization_id,
          role,
          created_at,
          organizations (
            id,
            name
          )
        `,
      )
      .eq(
        "user_id",
        user.id,
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        },
      )
      .order(
        "organization_id",
        {
          ascending:
            true,
        },
      );

  if (
    error
  ) {
    throw new Error(
      error.message,
    );
  }

  const rows =
    (
      data ??
      []
    ) as unknown as
      OrganizationMembershipRow[];

  return orderOrganizationMemberships(
    rows.map(
      mapOrganizationMembership,
    ),
  );
}

export async function getCurrentOrganization() {
  const memberships =
    await getOrganizationMemberships();

  const persistedOrganizationId =
    memberships.length >
    1
      ? await getPersistedActiveOrganizationId()
      : null;

  const activeMembership =
    resolveActiveOrganizationMembership(
      memberships,
      persistedOrganizationId,
    );

  if (
    !activeMembership
  ) {
    return null;
  }

  return {
    organizationId:
      activeMembership.organizationId,

    role:
      activeMembership.role,

    organization:
      activeMembership.organization,
  };
}
