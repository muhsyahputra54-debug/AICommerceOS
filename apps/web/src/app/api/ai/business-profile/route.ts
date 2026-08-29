import { NextResponse } from "next/server";

import {
  logAiPersistenceFailure,
} from "@/lib/ai/ai-persistence-observability";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

const SALES_MODELS = [
  "b2c",
  "b2b",
  "hybrid",
  "other",
] as const;

type SalesModel =
  (typeof SALES_MODELS)[number];

type BusinessProfileBody = {
  industry?: unknown;
  businessType?: unknown;
  salesModel?: unknown;
  primaryMarket?: unknown;
  primarySalesChannels?: unknown;
  pricingStrategy?: unknown;
  primaryGoal?: unknown;
  operationalPriorities?: unknown;
  businessDescription?: unknown;
};

type NullableStringResult = {
  valid: boolean;
  value: string | null;
};

type StringArrayResult = {
  valid: boolean;
  value: string[];
};

type SalesModelResult = {
  valid: boolean;
  value: SalesModel | null;
};

const PROFILE_SELECT = [
  "organization_id",
  "industry",
  "business_type",
  "sales_model",
  "primary_market",
  "primary_sales_channels",
  "pricing_strategy",
  "primary_goal",
  "operational_priorities",
  "business_description",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at",
].join(", ");

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeNullableString(
  value: unknown,
  maxLength: number,
): NullableStringResult {
  if (
    value === undefined ||
    value === null
  ) {
    return {
      valid: true,
      value: null,
    };
  }

  if (typeof value !== "string") {
    return {
      valid: false,
      value: null,
    };
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return {
      valid: true,
      value: null,
    };
  }

  if (
    normalized.length >
    maxLength
  ) {
    return {
      valid: false,
      value: null,
    };
  }

  return {
    valid: true,
    value: normalized,
  };
}

function normalizeSalesModel(
  value: unknown,
): SalesModelResult {
  if (
    value === undefined ||
    value === null
  ) {
    return {
      valid: true,
      value: null,
    };
  }

  if (typeof value !== "string") {
    return {
      valid: false,
      value: null,
    };
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  if (!normalized) {
    return {
      valid: true,
      value: null,
    };
  }

  if (
    !SALES_MODELS.includes(
      normalized as SalesModel,
    )
  ) {
    return {
      valid: false,
      value: null,
    };
  }

  return {
    valid: true,
    value:
      normalized as SalesModel,
  };
}

function normalizeStringArray(
  value: unknown,
  maxItems: number,
): StringArrayResult {
  if (
    value === undefined ||
    value === null
  ) {
    return {
      valid: true,
      value: [],
    };
  }

  if (!Array.isArray(value)) {
    return {
      valid: false,
      value: [],
    };
  }

  if (
    value.some(
      (item) =>
        typeof item !==
        "string",
    )
  ) {
    return {
      valid: false,
      value: [],
    };
  }

  const normalized =
    Array.from(
      new Set(
        value
          .map(
            (item) =>
              (
                item as string
              ).trim(),
          )
          .filter(Boolean),
      ),
    );

  if (
    normalized.length >
    maxItems
  ) {
    return {
      valid: false,
      value: [],
    };
  }

  return {
    valid: true,
    value: normalized,
  };
}

async function getRequestContext() {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        },
      ),
    } as const;
  }

  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return {
      error: NextResponse.json(
        {
          error:
            "Organization aktif tidak ditemukan.",
        },
        {
          status: 401,
        },
      ),
    } as const;
  }

  return {
    supabase,
    user,
    organizationId:
      currentOrganization.organizationId,
  } as const;
}

export async function GET(
  request: Request,
) {
  const requestId =
    request.headers.get(
      "x-request-id",
    );

  const context =
    await getRequestContext();

  if ("error" in context) {
    return context.error;
  }

  const {
    supabase,
    organizationId,
  } = context;

  const {
    data: profile,
    error,
  } = await supabase
    .from(
      "ai_business_profiles",
    )
    .select(PROFILE_SELECT)
    .eq(
      "organization_id",
      organizationId,
    )
    .maybeSingle();

  if (error) {
    logAiPersistenceFailure({
      operation:
        "business_profile_load",
      requestId,
      error,
    });

    return NextResponse.json(
      {
        error:
          "Profil bisnis AI tidak dapat dimuat.",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    profile:
      profile ?? null,
  });
}

export async function PUT(
  request: Request,
) {
  const requestId =
    request.headers.get(
      "x-request-id",
    );

  const context =
    await getRequestContext();

  if ("error" in context) {
    return context.error;
  }

  const {
    supabase,
    user,
    organizationId,
  } = context;

  const rawBody =
    await request
      .json()
      .catch(
        () => null,
      );

  if (!isPlainObject(rawBody)) {
    return NextResponse.json(
      {
        error:
          "Data profil bisnis tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  const body =
    rawBody as BusinessProfileBody;

  const industry =
    normalizeNullableString(
      body.industry,
      120,
    );

  const businessType =
    normalizeNullableString(
      body.businessType,
      120,
    );

  const salesModel =
    normalizeSalesModel(
      body.salesModel,
    );

  const primaryMarket =
    normalizeNullableString(
      body.primaryMarket,
      160,
    );

  const primarySalesChannels =
    normalizeStringArray(
      body.primarySalesChannels,
      20,
    );

  const pricingStrategy =
    normalizeNullableString(
      body.pricingStrategy,
      500,
    );

  const primaryGoal =
    normalizeNullableString(
      body.primaryGoal,
      1000,
    );

  const operationalPriorities =
    normalizeStringArray(
      body.operationalPriorities,
      20,
    );

  const businessDescription =
    normalizeNullableString(
      body.businessDescription,
      3000,
    );

  if (
    !industry.valid ||
    !businessType.valid ||
    !salesModel.valid ||
    !primaryMarket.valid ||
    !primarySalesChannels.valid ||
    !pricingStrategy.valid ||
    !primaryGoal.valid ||
    !operationalPriorities.valid ||
    !businessDescription.valid
  ) {
    return NextResponse.json(
      {
        error:
          "Data profil bisnis tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  const profileValues = {
    industry:
      industry.value,

    business_type:
      businessType.value,

    sales_model:
      salesModel.value,

    primary_market:
      primaryMarket.value,

    primary_sales_channels:
      primarySalesChannels.value,

    pricing_strategy:
      pricingStrategy.value,

    primary_goal:
      primaryGoal.value,

    operational_priorities:
      operationalPriorities.value,

    business_description:
      businessDescription.value,
  };

  const {
    data: existingProfile,
    error: existingError,
  } = await supabase
    .from(
      "ai_business_profiles",
    )
    .select(
      "organization_id",
    )
    .eq(
      "organization_id",
      organizationId,
    )
    .maybeSingle();

  if (existingError) {
    logAiPersistenceFailure({
      operation:
        "business_profile_check_existing",
      requestId,
      error:
        existingError,
    });

    return NextResponse.json(
      {
        error:
          "Profil bisnis AI tidak dapat disimpan.",
      },
      {
        status: 500,
      },
    );
  }

  if (existingProfile) {
    const {
      data: profile,
      error,
    } = await supabase
      .from(
        "ai_business_profiles",
      )
      .update({
        ...profileValues,
        updated_by:
          user.id,
      })
      .eq(
        "organization_id",
        organizationId,
      )
      .select(
        PROFILE_SELECT,
      )
      .single();

    if (error) {
      logAiPersistenceFailure({
        operation:
          "business_profile_update",
        requestId,
        error,
      });

      return NextResponse.json(
        {
          error:
            "Profil bisnis AI tidak dapat disimpan.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      profile,
    });
  }

  const {
    data: createdProfile,
    error: createError,
  } = await supabase
    .from(
      "ai_business_profiles",
    )
    .insert({
      organization_id:
        organizationId,

      ...profileValues,

      created_by:
        user.id,

      updated_by:
        user.id,
    })
    .select(
      PROFILE_SELECT,
    )
    .single();

  if (
    createError?.code ===
    "23505"
  ) {
    const {
      data: profile,
      error: retryError,
    } = await supabase
      .from(
        "ai_business_profiles",
      )
      .update({
        ...profileValues,
        updated_by:
          user.id,
      })
      .eq(
        "organization_id",
        organizationId,
      )
      .select(
        PROFILE_SELECT,
      )
      .single();

    if (retryError) {
      logAiPersistenceFailure({
        operation:
          "business_profile_update_after_concurrent_create",
        requestId,
        error:
          retryError,
      });

      return NextResponse.json(
        {
          error:
            "Profil bisnis AI tidak dapat disimpan.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      profile,
    });
  }

  if (createError) {
    logAiPersistenceFailure({
      operation:
        "business_profile_create",
      requestId,
      error:
        createError,
    });

    return NextResponse.json(
      {
        error:
          "Profil bisnis AI tidak dapat disimpan.",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json(
    {
      profile:
        createdProfile,
    },
    {
      status: 201,
    },
  );
}