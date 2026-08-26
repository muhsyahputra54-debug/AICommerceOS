import {
  redirect,
} from "next/navigation";

import {
  GuidedStartChannelsForm,
} from "@/components/guided-start/GuidedStartChannelsForm";

import {
  getCurrentOrganization,
} from "@/lib/supabase/current-organization";

export default async function GuidedStartChannelsPage() {
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
    <GuidedStartChannelsForm />
  );
}