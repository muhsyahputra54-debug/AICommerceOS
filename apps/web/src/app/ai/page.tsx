import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { Bot, Sparkles } from "lucide-react";

export default async function AIAssistantPage() {
  const locale = await getLocale();
  const copy = getDictionary(locale).aiAssistant;

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {copy.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {copy.description}
          </p>
        </div>

        {/* AI Assistant Card */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* Assistant Header */}
          <div className="flex items-center gap-4 border-b p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h2 className="font-semibold">
                {copy.assistant.title}
              </h2>

              <p className="text-sm text-muted-foreground">
                {copy.assistant.status}
              </p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              {copy.workspace.title}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {copy.workspace.description}
            </p>
          </div>

          {/* Input Placeholder */}
          <div className="border-t p-4">
            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {copy.inputPlaceholder}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
