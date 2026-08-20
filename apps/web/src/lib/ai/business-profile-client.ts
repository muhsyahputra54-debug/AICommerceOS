export type BusinessProfile = {
  organization_id: string;

  industry:
    | string
    | null;

  business_type:
    | string
    | null;

  sales_model:
    | string
    | null;

  primary_market:
    | string
    | null;

  primary_sales_channels:
    string[];

  pricing_strategy:
    | string
    | null;

  primary_goal:
    | string
    | null;

  operational_priorities:
    string[];

  business_description:
    | string
    | null;

  created_by:
    | string
    | null;

  updated_by:
    | string
    | null;

  created_at: string;
  updated_at: string;
};

export type BusinessProfileResponse = {
  profile?:
    | BusinessProfile
    | null;

  error?: string;
};

export type BusinessProfileForm = {
  industry: string;
  businessType: string;
  salesModel: string;
  primaryMarket: string;
  primarySalesChannels: string;
  pricingStrategy: string;
  primaryGoal: string;
  operationalPriorities: string;
  businessDescription: string;
};

export const EMPTY_BUSINESS_PROFILE_FORM:
  BusinessProfileForm = {
    industry: "",
    businessType: "",
    salesModel: "",
    primaryMarket: "",
    primarySalesChannels: "",
    pricingStrategy: "",
    primaryGoal: "",
    operationalPriorities: "",
    businessDescription: "",
  };

export function listInputToArray(
  value: string,
) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map(
          (item) =>
            item.trim(),
        )
        .filter(Boolean),
    ),
  );
}

export function businessProfileToForm(
  profile:
    | BusinessProfile
    | null,
): BusinessProfileForm {
  if (!profile) {
    return {
      ...EMPTY_BUSINESS_PROFILE_FORM,
    };
  }

  return {
    industry:
      profile.industry ?? "",

    businessType:
      profile.business_type ?? "",

    salesModel:
      profile.sales_model ?? "",

    primaryMarket:
      profile.primary_market ?? "",

    primarySalesChannels:
      Array.isArray(
        profile.primary_sales_channels,
      )
        ? profile.primary_sales_channels.join(
            ", ",
          )
        : "",

    pricingStrategy:
      profile.pricing_strategy ?? "",

    primaryGoal:
      profile.primary_goal ?? "",

    operationalPriorities:
      Array.isArray(
        profile.operational_priorities,
      )
        ? profile.operational_priorities.join(
            ", ",
          )
        : "",

    businessDescription:
      profile.business_description ?? "",
  };
}
