import type {
  Metadata,
} from "next";

import GrowthAssistantWorkspace from "@/components/growth/GrowthAssistantWorkspace";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type {
  ControlledPublicationDestination,
} from "@/lib/ai/controlled-publication-ui";
import {
  getLocale,
} from "@/lib/i18n/server";
import {
  getCurrentOrganization,
} from "@/lib/supabase/current-organization";
import {
  createClient,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title:
    "Growth Assistant | LAKUVO",
  description:
    "Growth Assistant LAKUVO membantu menyusun ide konten, rencana pemasaran, draft caption, ide promosi, dan langkah growth berdasarkan konteks bisnis yang tersedia.",
};

type PublicationContext = {
  allowed: boolean;
  destinations:
    ControlledPublicationDestination[];
};

function textValue(
  value: unknown,
) {
  return typeof value ===
    "string" &&
    value.trim()
    ? value.trim()
    : null;
}

function recordValue(
  value: unknown,
): Record<string, unknown> | null {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  )
    ? value as
        Record<string, unknown>
    : null;
}

async function loadPublicationContext():
Promise<PublicationContext> {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return {
      allowed:
        false,
      destinations:
        [],
    };
  }

  const role =
    String(
      currentOrganization.role ??
        "",
    );

  if (
    role !== "owner" &&
    role !== "admin"
  ) {
    return {
      allowed:
        false,
      destinations:
        [],
    };
  }

  const supabase =
    await createClient();

  const {
    data:
      accounts,
    error:
      accountsError,
  } =
    await supabase
      .from(
        "marketplace_accounts",
      )
      .select(
        "id, provider, name, status",
      )
      .eq(
        "organization_id",
        currentOrganization
          .organizationId,
      );

  if (accountsError) {
    throw new Error(
      accountsError.message,
    );
  }

  const destinations:
    ControlledPublicationDestination[] =
      [];

  for (
    const rawAccount of
    accounts ?? []
  ) {
    const account =
      recordValue(
        rawAccount,
      );

    if (!account) {
      continue;
    }

    const accountId =
      textValue(
        account.id,
      );

    const provider =
      textValue(
        account.provider,
      );

    if (
      !accountId ||
      !provider
    ) {
      continue;
    }

    const {
      data:
        authorizedShops,
      error:
        authorizedShopsError,
    } =
      await supabase.rpc(
        "get_marketplace_authorized_shops",
        {
          p_marketplace_account_id:
            accountId,
        },
      );

    if (authorizedShopsError) {
      throw new Error(
        authorizedShopsError
          .message,
      );
    }

    if (
      !Array.isArray(
        authorizedShops,
      )
    ) {
      continue;
    }

    for (
      const rawShop of
      authorizedShops
    ) {
      const shop =
        recordValue(
          rawShop,
        );

      if (
        !shop ||
        shop.is_selected !==
          true ||
        shop.status !==
          "active"
      ) {
        continue;
      }

      const id =
        textValue(
          shop.id,
        );

      const externalShopId =
        textValue(
          shop.external_shop_id,
        );

      const name =
        textValue(
          shop.name,
        );

      if (
        !id ||
        !externalShopId ||
        !name
      ) {
        continue;
      }

      destinations.push({
        id,
        provider:
          provider.toLowerCase(),
        name,
        externalShopId,
      });
    }
  }

  const unique =
    new Map<
      string,
      ControlledPublicationDestination
    >();

  for (
    const destination of
    destinations
  ) {
    unique.set(
      destination.id,
      destination,
    );
  }

  return {
    allowed:
      true,
    destinations:
      Array.from(
        unique.values(),
      ).sort(
        (
          left,
          right,
        ) =>
          left.name.localeCompare(
            right.name,
          ),
      ),
  };
}

export default async function GrowthPage() {
  const [
    locale,
    publicationContext,
  ] =
    await Promise.all([
      getLocale(),
      loadPublicationContext(),
    ]);

  return (
    <DashboardLayout>
      <GrowthAssistantWorkspace
        locale={locale}
        publicationAllowed={
          publicationContext
            .allowed
        }
        publicationDestinations={
          publicationContext
            .destinations
        }
      />
    </DashboardLayout>
  );
}