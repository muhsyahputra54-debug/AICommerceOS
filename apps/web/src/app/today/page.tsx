import type {
  Metadata,
} from "next";

import DashboardLayout from "@/components/layout/DashboardLayout";
import TodayDashboard from "@/components/today/TodayDashboard";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  loadLakuvoTodayFromServer,
} from "@/lib/ai/today-server-read";

import {
  getDictionary,
} from "@/lib/i18n/dictionaries";

import {
  getLocale,
} from "@/lib/i18n/server";

export const metadata:
  Metadata = {
    title:
      "TODAY",
  };

export default async function TodayPage() {
  const locale =
    await getLocale();

  const dictionary =
    getDictionary(locale);

  const snapshot =
    await loadLakuvoTodayFromServer();

  return (
    <DashboardLayout>
      {
        snapshot
          ? (
              <TodayDashboard
                snapshot={
                  snapshot
                }
                locale={
                  locale
                }
                copy={
                  dictionary.today
                }
              />
            )
          : (
              <div className="mx-auto w-full max-w-[1600px]">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {
                        dictionary.today
                          .noOrganizationTitle
                      }
                    </CardTitle>

                    <CardDescription>
                      {
                        dictionary.today
                          .noOrganizationDescription
                      }
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {
                        dictionary.today
                          .noOrganizationHelp
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            )
      }
    </DashboardLayout>
  );
}