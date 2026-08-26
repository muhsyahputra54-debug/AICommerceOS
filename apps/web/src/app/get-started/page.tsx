import {
  redirect,
} from "next/navigation";

import {
  GuidedStartEntry,
} from "@/components/guided-start/GuidedStartEntry";
import {
  getCurrentOrganization,
} from "@/lib/supabase/current-organization";

export default async function GetStartedPage() {
  const currentOrganization =
    await getCurrentOrganization();

  if (
    !currentOrganization
  ) {
    redirect(
      "/onboarding",
    );
  }

  const organizationName =
    currentOrganization.organization?.name ??
    "bisnis Anda";

  return (
    <GuidedStartEntry
      organizationName={
        organizationName
      }
    />
  );
}