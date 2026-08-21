import type { Metadata } from "next";

import ActionCenterWorkspace from "@/components/ai/ActionCenterWorkspace";
import DashboardLayout from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: "AI Action Center",
};

export default function ActionCenterPage() {
  return (
    <DashboardLayout>
      <ActionCenterWorkspace />
    </DashboardLayout>
  );
}
