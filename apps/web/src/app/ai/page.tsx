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
