import AIChatWorkspace from "@/components/ai/AIChatWorkspace";
import {
  projectAssistantAgentDelegationOption,
} from "@/lib/ai/assistant-agent-delegation";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";

export default async function AIAssistantPage() {
  const locale = await getLocale();
  const copy = getDictionary(locale).aiAssistant;

  const currentOrganization =
    await getCurrentOrganization();

  const supabase =
    await createClient();

  const agentRowsResult =
    currentOrganization
      ? await supabase
          .from("ai_agents")
          .select(
            "id, name, purpose, approved_contexts, is_active",
          )
          .eq(
            "organization_id",
            currentOrganization.organizationId,
          )
          .eq(
            "is_active",
            true,
          )
          .order("created_at", {
            ascending:
              false,
          })
      : {
          data:
            null,

          error:
            null,
        };

  const agentRows =
    agentRowsResult.data;

  const agentRowsError =
    agentRowsResult.error;

  const agentOptions =
    agentRowsError
      ? []
      : (agentRows ?? []).flatMap(
          (row) => {
            const option =
              projectAssistantAgentDelegationOption(
                row,
              );

            return option
              ? [option]
              : [];
          },
        );

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
          agentOptions={agentOptions}
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

            insightsTitle:
              copy.chat.insightsTitle,
            insightsDescription:
              copy.chat.insightsDescription,

            insightCatalogReadinessTitle:
              copy.chat.insightCatalogReadinessTitle,
            insightCatalogReadinessDescription:
              copy.chat.insightCatalogReadinessDescription,

            insightCompetitorThresholdTitle:
              copy.chat.insightCompetitorThresholdTitle,
            insightCompetitorThresholdDescription:
              copy.chat.insightCompetitorThresholdDescription,

            insightNoOrdersTitle:
              copy.chat.insightNoOrdersTitle,
            insightNoOrdersDescription:
              copy.chat.insightNoOrdersDescription,

            insightPriceMonitoringNoObservationsTitle:
              copy.chat.insightPriceMonitoringNoObservationsTitle,
            insightPriceMonitoringNoObservationsDescription:
              copy.chat.insightPriceMonitoringNoObservationsDescription,

            insightAskPrefix:
              copy.chat.insightAskPrefix,

            businessProfileButton:
              copy.chat.businessProfileButton,
            businessProfileTitle:
              copy.chat.businessProfileTitle,
            businessProfileDescription:
              copy.chat.businessProfileDescription,
            businessProfileLoading:
              copy.chat.businessProfileLoading,
            businessProfileError:
              copy.chat.businessProfileError,
            businessProfileSaved:
              copy.chat.businessProfileSaved,
            businessProfileSave:
              copy.chat.businessProfileSave,
            businessProfileSaving:
              copy.chat.businessProfileSaving,

            businessProfileIndustry:
              copy.chat.businessProfileIndustry,
            businessProfileIndustryPlaceholder:
              copy.chat.businessProfileIndustryPlaceholder,

            businessProfileBusinessType:
              copy.chat.businessProfileBusinessType,
            businessProfileBusinessTypePlaceholder:
              copy.chat.businessProfileBusinessTypePlaceholder,

            businessProfileSalesModel:
              copy.chat.businessProfileSalesModel,
            businessProfileSalesModelNone:
              copy.chat.businessProfileSalesModelNone,
            businessProfileSalesModelB2C:
              copy.chat.businessProfileSalesModelB2C,
            businessProfileSalesModelB2B:
              copy.chat.businessProfileSalesModelB2B,
            businessProfileSalesModelHybrid:
              copy.chat.businessProfileSalesModelHybrid,
            businessProfileSalesModelOther:
              copy.chat.businessProfileSalesModelOther,

            businessProfilePrimaryMarket:
              copy.chat.businessProfilePrimaryMarket,
            businessProfilePrimaryMarketPlaceholder:
              copy.chat.businessProfilePrimaryMarketPlaceholder,

            businessProfileSalesChannels:
              copy.chat.businessProfileSalesChannels,
            businessProfileSalesChannelsHint:
              copy.chat.businessProfileSalesChannelsHint,

            businessProfilePricingStrategy:
              copy.chat.businessProfilePricingStrategy,
            businessProfilePricingStrategyPlaceholder:
              copy.chat.businessProfilePricingStrategyPlaceholder,

            businessProfilePrimaryGoal:
              copy.chat.businessProfilePrimaryGoal,
            businessProfilePrimaryGoalPlaceholder:
              copy.chat.businessProfilePrimaryGoalPlaceholder,

            businessProfileOperationalPriorities:
              copy.chat.businessProfileOperationalPriorities,
            businessProfileOperationalPrioritiesHint:
              copy.chat.businessProfileOperationalPrioritiesHint,

            businessProfileDescriptionLabel:
              copy.chat.businessProfileDescriptionLabel,
            businessProfileDescriptionPlaceholder:
              copy.chat.businessProfileDescriptionPlaceholder,

            memoryButton:
              copy.chat.memoryButton,
            memoryTitle:
              copy.chat.memoryTitle,
            memoryDescription:
              copy.chat.memoryDescription,
            memoryEmpty:
              copy.chat.memoryEmpty,
            memoryLoading:
              copy.chat.memoryLoading,
            memoryActive:
              copy.chat.memoryActive,
            memoryArchived:
              copy.chat.memoryArchived,
            memoryDisable:
              copy.chat.memoryDisable,
            memoryRestore:
              copy.chat.memoryRestore,
            memoryDelete:
              copy.chat.memoryDelete,
            memoryDeleteConfirm:
              copy.chat.memoryDeleteConfirm,
            memoryError:
              copy.chat.memoryError,

            memorySuggestionTitle:
              copy.chat.memorySuggestionTitle,
            memorySuggestionRemember:
              copy.chat.memorySuggestionRemember,
            memorySuggestionSkip:
              copy.chat.memorySuggestionSkip,
            memorySuggestionSaving:
              copy.chat.memorySuggestionSaving,
            memorySuggestionError:
              copy.chat.memorySuggestionError,

            memoryTypePreference:
              copy.chat.memoryTypePreference,
            memoryTypeGoal:
              copy.chat.memoryTypeGoal,
            memoryTypeConstraint:
              copy.chat.memoryTypeConstraint,
            memoryTypeBusinessContext:
              copy.chat.memoryTypeBusinessContext,

            agentDelegationButton:
              copy.chat.agentDelegationButton,
            agentDelegationTitle:
              copy.chat.agentDelegationTitle,
            agentDelegationDescription:
              copy.chat.agentDelegationDescription,
            agentDelegationAgent:
              copy.chat.agentDelegationAgent,
            agentDelegationSelectPlaceholder:
              copy.chat.agentDelegationSelectPlaceholder,
            agentDelegationObjective:
              copy.chat.agentDelegationObjective,
            agentDelegationObjectivePlaceholder:
              copy.chat.agentDelegationObjectivePlaceholder,
            agentDelegationRun:
              copy.chat.agentDelegationRun,
            agentDelegationRunning:
              copy.chat.agentDelegationRunning,
            agentDelegationNoAgents:
              copy.chat.agentDelegationNoAgents,
            agentDelegationCompleted:
              copy.chat.agentDelegationCompleted,
            agentDelegationPending:
              copy.chat.agentDelegationPending,
            agentDelegationClose:
              copy.chat.agentDelegationClose,
            agentDelegationError:
              copy.chat.agentDelegationError,

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
