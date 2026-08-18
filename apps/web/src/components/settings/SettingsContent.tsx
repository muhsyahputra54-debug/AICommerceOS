"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default function SettingsContent() {
  const { locale } = useLanguage();
  const dictionary = getDictionary(locale);
  const settings = dictionary.settings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {settings.title}
        </h1>

        <p className="mt-2 text-muted-foreground">
          {settings.description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            {settings.general.title}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {settings.general.description}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-sm font-medium">
                {settings.general.businessName}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                LAKUVO
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">
                {settings.general.accountRole}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {settings.general.administrator}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            {settings.ai.title}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {settings.ai.description}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-sm font-medium">
                {settings.ai.assistant}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {settings.ai.readyToConfigure}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">
                {settings.ai.automation}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {settings.ai.readyToConfigure}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            {settings.account.title}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {settings.account.description}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-sm font-medium">
                {settings.account.role}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {settings.account.administrator}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">
                {settings.account.status}
              </p>

              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                {settings.account.active}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            {settings.system.title}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {settings.system.description}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-sm font-medium">
                {settings.system.environment}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {settings.system.development}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">
                {settings.system.systemStatus}
              </p>

              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                {settings.system.operational}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
