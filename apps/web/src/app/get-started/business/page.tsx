import {
  redirect,
} from "next/navigation";

import {
  GuidedStartBusinessProfileForm,
} from "@/components/guided-start/GuidedStartBusinessProfileForm";

import {
  getCurrentOrganization,
} from "@/lib/supabase/current-organization";

export default async function GuidedStartBusinessPage() {
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
    <GuidedStartBusinessProfileForm />
  );
}