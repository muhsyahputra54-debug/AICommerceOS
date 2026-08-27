import type {
  Metadata,
} from "next";

import GrowthAssistantWorkspace from "@/components/growth/GrowthAssistantWorkspace";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  getLocale,
} from "@/lib/i18n/server";

export const metadata: Metadata = {
  title:
    "Growth Assistant | LAKUVO",
  description:
    "Growth Assistant LAKUVO membantu menyusun ide konten, rencana pemasaran, draft caption, ide promosi, dan langkah growth berdasarkan konteks bisnis yang tersedia.",
};

export default async function GrowthPage() {
  const locale =
    await getLocale();

  return (
    <DashboardLayout>
      <GrowthAssistantWorkspace
        locale={locale}
      />
    </DashboardLayout>
  );
}