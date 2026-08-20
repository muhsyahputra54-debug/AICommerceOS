import { NextResponse } from "next/server";

import {
  buildProactiveInsights,
  type ProactiveInsightSnapshot,
} from "@/lib/ai/proactive-insights";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type LatestObservation = {
  target_id: string;
  threshold_triggered: boolean;
  observed_at: string;
};

async function getRequestContext() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth.getUser();

  if (
    error ||
    !user
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              "Authentication required.",
          },
          {
            status: 401,
          },
        ),
    };
  }

  const organization =
    await getCurrentOrganization();

  if (!organization) {
    return {
      error:
        NextResponse.json(
          {
            error:
              "Organization aktif tidak ditemukan.",
          },
          {
            status: 401,
          },
        ),
    };
  }

  return {
    supabase,
    user,
    organizationId:
      organization.organizationId,
  };
}

export async function GET() {
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

  const [
    productsCountResult,
    nonpositiveStockCountResult,
    nonpositivePriceCountResult,
    ordersCountResult,
    activeTargetsResult,
  ] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        )
        .eq(
          "organization_id",
          organizationId,
        ),

      supabase
        .from("products")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        )
        .eq(
          "organization_id",
          organizationId,
        )
        .lte(
          "stock",
          0,
        ),

      supabase
        .from("products")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        )
        .eq(
          "organization_id",
          organizationId,
        )
        .lte(
          "price",
          0,
        ),

      supabase
        .from("orders")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        )
        .eq(
          "organization_id",
          organizationId,
        ),

      supabase
        .from(
          "price_monitor_targets",
        )
        .select(
          "id",
        )
        .eq(
          "organization_id",
          organizationId,
        )
        .eq(
          "is_active",
          true,
        ),
    ]);

  const contextError =
    productsCountResult.error ??
    nonpositiveStockCountResult.error ??
    nonpositivePriceCountResult.error ??
    ordersCountResult.error ??
    activeTargetsResult.error;

  if (contextError) {
    console.error(
      "Failed to load proactive AI insight snapshot.",
      {
        organizationId,
        userId:
          user.id,
        error:
          contextError,
      },
    );

    return NextResponse.json(
      {
        error:
          "Insight bisnis belum dapat dimuat.",
      },
      {
        status: 500,
      },
    );
  }

  const activeTargets =
    activeTargetsResult.data ??
    [];

  const activeTargetIds =
    activeTargets
      .map(
        (target) =>
          target.id,
      )
      .filter(
        (
          id,
        ): id is string =>
          typeof id ===
            "string" &&
          id.length > 0,
      );

  let latestObservations:
    LatestObservation[] = [];

  if (
    activeTargetIds.length > 0
  ) {
    const observationResults =
      await Promise.all(
        activeTargetIds.map(
          async (
            targetId,
          ) => {
            const {
              data,
              error,
            } =
              await supabase
                .from(
                  "price_observations",
                )
                .select(
                  "target_id, threshold_triggered, observed_at",
                )
                .eq(
                  "organization_id",
                  organizationId,
                )
                .eq(
                  "target_id",
                  targetId,
                )
                .order(
                  "observed_at",
                  {
                    ascending:
                      false,
                  },
                )
                .limit(1)
                .maybeSingle();

            return {
              targetId,
              data,
              error,
            };
          },
        ),
      );

    const observationError =
      observationResults.find(
        (
          result,
        ) =>
          Boolean(
            result.error,
          ),
      );

    if (
      observationError
        ?.error
    ) {
      console.error(
        "Failed to load latest price observations for proactive insights.",
        {
          organizationId,
          userId:
            user.id,
          targetId:
            observationError.targetId,
          error:
            observationError.error,
        },
      );

      return NextResponse.json(
        {
          error:
            "Insight bisnis belum dapat dimuat.",
        },
        {
          status: 500,
        },
      );
    }

    latestObservations =
      observationResults.flatMap(
        (
          result,
        ): LatestObservation[] => {
          const observation =
            result.data;

          if (!observation) {
            return [];
          }

          if (
            typeof observation.target_id !==
              "string" ||
            typeof observation
              .threshold_triggered !==
              "boolean" ||
            typeof observation.observed_at !==
              "string"
          ) {
            return [];
          }

          return [
            {
              target_id:
                observation.target_id,

              threshold_triggered:
                observation
                  .threshold_triggered,

              observed_at:
                observation.observed_at,
            },
          ];
        },
      );
  }

  const snapshot:
    ProactiveInsightSnapshot = {
      products: {
        totalCount:
          productsCountResult.count ??
          0,

        nonpositiveStockCount:
          nonpositiveStockCountResult.count ??
          0,

        nonpositivePriceCount:
          nonpositivePriceCountResult.count ??
          0,
      },

      orders: {
        totalCount:
          ordersCountResult.count ??
          0,
      },

      priceMonitoring: {
        activeTargetCount:
          activeTargetIds.length,

        observationCount:
          latestObservations.length,

        thresholdTriggeredCount:
          latestObservations.filter(
            (
              observation,
            ) =>
              observation
                .threshold_triggered ===
              true,
          ).length,
      },
    };

  const insights =
    buildProactiveInsights(
      snapshot,
    );

  return NextResponse.json({
    generatedAt:
      new Date().toISOString(),

    insights,
  });
}