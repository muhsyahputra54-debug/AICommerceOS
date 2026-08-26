import {
  redirect,
} from "next/navigation";

import {
  GuidedStartMarketingPlan,
} from "@/components/guided-start/GuidedStartMarketingPlan";

import {
  getCurrentOrganization,
} from "@/lib/supabase/current-organization";

export default async function GuidedStartMarketingPage() {
  const currentOrganization =
    await getCurrentOrganization();

  if (
    !currentOrganization
  ) {
    redirect(
      "/onboarding",
    );
  }

  return (
    <GuidedStartMarketingPlan />
  );
}