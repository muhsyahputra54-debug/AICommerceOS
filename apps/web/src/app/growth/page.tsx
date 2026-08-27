import type {
  Metadata,
} from "next";

import GrowthAssistantWorkspace from "@/components/growth/GrowthAssistantWorkspace";
import DashboardLayout from "@/components/layout/DashboardLayout";

import {
  controlledPublicationChannelDestinationIsCompatible,
} from "@/lib/ai/controlled-publication-channel-target";

import type {
  ControlledPublicationDestination,
} from "@/lib/ai/controlled-publication-ui";

import {
  parsePublishingDestinationRecord,
} from "@/lib/ai/publishing-destination";

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
    data,
    error,
  } =
    await supabase.rpc(
      "get_publishing_channel_destinations",
      {
        p_organization_id:
          currentOrganization
            .organizationId,

        p_provider:
          null,
      },
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "Publishing destination response tidak valid.",
    );
  }

  const destinations:
    ControlledPublicationDestination[] =
      [];

  for (const raw of data) {
    const row =
      recordValue(
        raw,
      );

    if (!row) {
      continue;
    }

    const parsed =
      parsePublishingDestinationRecord({
        ...row,

        organization_id:
          currentOrganization
            .organizationId,
      });

    if (
      !parsed.ok ||
      !parsed.value.isSelected ||
      !controlledPublicationChannelDestinationIsCompatible(
        parsed.value,
      )
    ) {
      continue;
    }

    destinations.push({
      id:
        parsed.value.id,

      provider:
        parsed.value.provider,

      destinationType:
        parsed.value.destinationType,

      externalDestinationId:
        parsed.value.externalDestinationId,

      name:
        parsed.value.displayName,
    });
  }

  return {
    allowed:
      true,

    destinations:
      destinations.sort(
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
