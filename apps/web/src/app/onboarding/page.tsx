import {
  redirect,
} from "next/navigation";

import {
  InitialOrganizationForm,
} from "@/components/onboarding/InitialOrganizationForm";
import {
  getOrganizationMemberships,
} from "@/lib/supabase/current-organization";

export default async function OnboardingPage() {
  const memberships =
    await getOrganizationMemberships();

  if (
    memberships.length >
    0
  ) {
    redirect(
      "/today",
    );
  }

  return (
    <InitialOrganizationForm />
  );
}
