import AIChatWorkspace from "@/components/ai/AIChatWorkspace";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";

export default async function AIAssistantPage() {
  const locale = await getLocale();
  const copy = getDictionary(locale).aiAssistant;

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {copy.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {copy.description}
          </p>
        </div>

        <AIChatWorkspace
          copy={{
            assistantTitle:
              copy.assistant.title,
            assistantStatus:
              copy.assistant.status,
            welcomeTitle:
              copy.workspace.title,
            welcomeDescription:
              copy.workspace.description,
            inputPlaceholder:
              copy.chat.inputPlaceholder,
            send:
              copy.chat.send,
            clear:
              copy.chat.clear,
            thinking:
              copy.chat.thinking,
            userLabel:
              copy.chat.userLabel,
            assistantLabel:
              copy.chat.assistantLabel,
            errorFallback:
              copy.chat.errorFallback,
            suggestions:
              copy.chat.suggestions,
          }}
        />
      </div>
    </DashboardLayout>
  );
}
