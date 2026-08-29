import { NextResponse } from "next/server";

import {
  parseMessages,
  parseProactiveInsightCode,
} from "@/lib/ai/chat-contract";
import {
  MAX_MEMORY_CONTENT_LENGTH,
  buildMemoryKey,
  findMatchingMemories,
  findPreviousUserMessage,
  getExplicitMemoryCommand,
  inferMemoryType,
  isReferenceMemoryValue,
  normalizeMemorySearchText,
  type MemoryCandidate,
} from "@/lib/ai/memory-contract";
import {
  buildAssistantSystemMessages,
  buildProactiveInsightContext,
} from "@/lib/ai/assistant-prompt";

import {
  loadAssistantAgentAdvisoryContext,
} from "@/lib/ai/assistant-agent-adapter";

import { buildBusinessContext } from "@/lib/ai/business-context";

import {
  buildSalesIntelligenceContext,
} from "@/lib/ai/sales-intelligence-context";

import {
  buildProductInventoryIntelligenceContext,
} from "@/lib/ai/product-inventory-intelligence-context";

import {
  buildBusinessIntelligenceSynthesis,
} from "@/lib/ai/business-intelligence-synthesis";

import {
  buildBusinessProfileContext,
  type BusinessProfileContextRow,
} from "@/lib/ai/business-profile-context";

import {
  buildMemoryContext,
  type ActiveMemoryContextRow,
} from "@/lib/ai/memory-context";

import {
  checkAiAllowance,
  getAiAllowanceMessage,
  getAiAllowanceStatus,
  recordOpenAIChatUsageSafely,
} from "@/lib/ai/metering";
import {
  createOpenAIChatCompletion,
} from "@/lib/ai/openai-chat";
import {
  logAiChatFailure,
} from "@/lib/ai/ai-chat-observability";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type ChatRequestBody = {
  messages?: unknown;
  conversationId?: unknown;
};

async function persistMemoryCommandAssistantMessage({
  supabase,
  requestId,
  conversationId,
  organizationId,
  userId,
  content,
}: {
  supabase:
    Awaited<
      ReturnType<
        typeof createClient
      >
    >;

  requestId:
    string | null;

  conversationId:
    string | null;

  organizationId:
    string;

  userId:
    string;

  content:
    string;
}) {
  if (!conversationId) {
    return null;
  }

  const createdAt =
    new Date().toISOString();

  const {
    error:
      messageError,
  } = await supabase
    .from(
      "ai_conversation_messages",
    )
    .insert({
      conversation_id:
        conversationId,

      organization_id:
        organizationId,

      user_id:
        userId,

      role:
        "assistant",

      content,

      created_at:
        createdAt,
    });

  if (messageError) {
    return messageError;
  }

  const {
    error:
      touchError,
  } = await supabase
    .from(
      "ai_conversations",
    )
    .update({
      updated_at:
        createdAt,

      last_message_at:
        createdAt,
    })
    .eq(
      "id",
      conversationId,
    )
    .eq(
      "organization_id",
      organizationId,
    )
    .eq(
      "user_id",
      userId,
    )
    .is(
      "archived_at",
      null,
    );

  if (touchError) {
    logAiChatFailure({
      operation:
        "memory_command_conversation_touch",
      requestId,
      error:
        touchError,
    });
  }

  return null;
}

type AgentAdvisoryReference = {
  agentId: string;
  runId: string;
};

function parseAgentAdvisoryReference(
  value: unknown,
): AgentAdvisoryReference | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  const record =
    value as Record<string, unknown>;

  const agentId =
    typeof record.agentId === "string"
      ? record.agentId.trim()
      : "";

  const runId =
    typeof record.runId === "string"
      ? record.runId.trim()
      : "";

  if (
    !agentId ||
    !runId
  ) {
    return null;
  }

  return {
    agentId,
    runId,
  };
}
export async function POST(
  request: Request,
) {
  const clientRequestId =
    request.headers.get(
      "x-request-id",
    );

  const supabase =
    await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    return NextResponse.json(
      {
        error:
          "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return NextResponse.json(
      {
        error:
          "Organization aktif tidak ditemukan.",
      },
      {
        status: 401,
      },
    );
  }

  const organizationId =
    currentOrganization.organizationId;

  const apiKey =
    process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OpenAI belum dikonfigurasi pada server.",
      },
      {
        status: 503,
      },
    );
  }

  const body =
    (await request
      .json()
      .catch(
        () => ({}),
      )) as ChatRequestBody & {
        proactiveInsightCode?: unknown;
        agentAdvisory?: unknown;
      };

  const proactiveInsightCode =
    parseProactiveInsightCode(
      body.proactiveInsightCode,
    );
  const agentAdvisoryReference =    parseAgentAdvisoryReference(      body.agentAdvisory,    );
  const messages =
    parseMessages(
      body.messages,
    );

  if (!messages) {
    return NextResponse.json(
      {
        error:
          "AI Assistant messages tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  const conversationId =
    typeof body.conversationId === "string"
      ? body.conversationId.trim()
      : null;

  const hasConversationId =
    body.conversationId !== undefined;

  const conversationIdIsValid =
    conversationId !== null &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      conversationId,
    );

  if (
    hasConversationId &&
    !conversationIdIsValid
  ) {
    return NextResponse.json(
      {
        error:
          "Conversation ID tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const allowance =
      await checkAiAllowance(
        organizationId,
      );

    if (!allowance.allowed) {
      return NextResponse.json(
        {
          error:
            getAiAllowanceMessage(
              allowance.reason,
            ),
        },
        {
          status:
            getAiAllowanceStatus(
              allowance.reason,
            ),
        },
      );
    }
  } catch {
    return NextResponse.json(
      {
        error:
          "AI usage metering tidak tersedia.",
      },
      {
        status: 503,
      },
    );
  }

  if (conversationId) {
    const {
      data: conversation,
      error: conversationError,
    } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq(
        "id",
        conversationId,
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .eq(
        "user_id",
        user.id,
      )
      .is(
        "archived_at",
        null,
      )
      .maybeSingle();

    if (conversationError) {
      logAiChatFailure({
        operation:
          "conversation_validate",
        requestId:
          clientRequestId,
        error:
          conversationError,
      });

      return NextResponse.json(
        {
          error:
            "Percakapan AI tidak dapat divalidasi.",
        },
        {
          status: 500,
        },
      );
    }

    if (!conversation) {
      return NextResponse.json(
        {
          error:
            "Percakapan AI aktif tidak ditemukan.",
        },
        {
          status: 404,
        },
      );
    }

    const latestUserMessage =
      messages[messages.length - 1];

    if (
      !latestUserMessage ||
      latestUserMessage.role !== "user"
    ) {
      return NextResponse.json(
        {
          error:
            "Pesan terakhir harus berasal dari pengguna.",
        },
        {
          status: 400,
        },
      );
    }

    const userMessageAt =
      new Date().toISOString();

    const {
      error: userMessageError,
    } = await supabase
      .from("ai_conversation_messages")
      .insert({
        conversation_id:
          conversationId,

        organization_id:
          organizationId,

        user_id:
          user.id,

        role:
          "user",

        content:
          latestUserMessage.content,

        created_at:
          userMessageAt,
      });

    if (userMessageError) {
      logAiChatFailure({
        operation:
          "user_message_persist",
        requestId:
          clientRequestId,
        error:
          userMessageError,
      });

      return NextResponse.json(
        {
          error:
            "Pesan pengguna tidak dapat disimpan.",
        },
        {
          status: 500,
        },
      );
    }

    const {
      error: touchError,
    } = await supabase
      .from("ai_conversations")
      .update({
        updated_at:
          userMessageAt,

        last_message_at:
          userMessageAt,
      })
      .eq(
        "id",
        conversationId,
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .eq(
        "user_id",
        user.id,
      )
      .is(
        "archived_at",
        null,
      );

    if (touchError) {
      logAiChatFailure({
        operation:
          "user_message_conversation_touch",
        requestId:
          clientRequestId,
        error:
          touchError,
      });
    }
  }

  const latestMemoryCommandMessage =
    messages[
      messages.length - 1
    ];

  const explicitMemoryCommand =
    latestMemoryCommandMessage
      ?.role === "user"
      ? getExplicitMemoryCommand(
          latestMemoryCommandMessage
            .content,
        )
      : null;

  if (
    explicitMemoryCommand
  ) {
    const memoryCommandUserId =
      user.id;

    async function respondToMemoryCommand(
      message: string,
      memoryAction:
        Record<
          string,
          unknown
        >,
    ) {
      const persistError =
        await persistMemoryCommandAssistantMessage({
            supabase,
            requestId:
              clientRequestId,
            conversationId,
          organizationId,
          userId:
            memoryCommandUserId,
          content:
            message,
        });

      if (persistError) {
        logAiChatFailure({
          operation:
            "memory_command_response_persist",
          requestId:
            clientRequestId,
          error:
            persistError,
        });

        return NextResponse.json(
          {
            error:
              "Respons memory AI tidak dapat disimpan.",
          },
          {
            status: 500,
          },
        );
      }

      return NextResponse.json({
        message,
        conversationId,
        memoryAction,
      });
    }

    let commandValue =
      explicitMemoryCommand.value;

    if (
      isReferenceMemoryValue(
        commandValue,
      )
    ) {
      const previousUserContent =
        findPreviousUserMessage(
          messages,
        );

      if (
        previousUserContent
      ) {
        commandValue =
          previousUserContent;
      } else {
        const message =
          explicitMemoryCommand
            .language === "id"
            ? "Sebutkan dulu hal yang ingin Anda minta saya ingat atau lupakan."
            : "Please specify what you want me to remember or forget.";

        return respondToMemoryCommand(
          message,
          {
            action:
              explicitMemoryCommand.action,
            status:
              "needs_detail",
          },
        );
      }
    }

    if (
      explicitMemoryCommand
        .action === "remember"
    ) {
      if (
        commandValue.length >
        MAX_MEMORY_CONTENT_LENGTH
      ) {
        const message =
          explicitMemoryCommand
            .language === "id"
            ? "Hal yang ingin diingat terlalu panjang. Tolong ringkas menjadi satu informasi penting."
            : "That is too long to save as one memory. Please shorten it to one important fact.";

        return respondToMemoryCommand(
          message,
          {
            action:
              "remember",
            status:
              "too_long",
          },
        );
      }

      const memoryType =
        inferMemoryType(
          commandValue,
        );

      const memoryKey =
        buildMemoryKey(
          memoryType,
          commandValue,
        );

      const {
        data: memory,
        error:
          memoryError,
      } = await supabase
        .from("ai_memories")
        .insert({
          organization_id:
            organizationId,

          user_id:
            user.id,

          memory_type:
            memoryType,

          memory_key:
            memoryKey,

          content:
            commandValue,

          source_kind:
            "explicit_user",

          source_conversation_id:
            conversationId,
        })
        .select(
          "id, memory_type, memory_key, content",
        )
        .single();

      if (
        memoryError &&
        memoryError.code !==
          "23505"
      ) {
        logAiChatFailure({
          operation:
            "explicit_memory_save",
          requestId:
            clientRequestId,
          error:
            memoryError,
        });

        return NextResponse.json(
          {
            error:
              "Memory AI tidak dapat disimpan.",
          },
          {
            status: 500,
          },
        );
      }

      if (
        memoryError?.code ===
        "23505"
      ) {
        const {
          data:
            existingMemory,
        } = await supabase
          .from("ai_memories")
          .select(
            "id",
          )
          .eq(
            "organization_id",
            organizationId,
          )
          .eq(
            "user_id",
            user.id,
          )
          .eq(
            "memory_type",
            memoryType,
          )
          .eq(
            "memory_key",
            memoryKey,
          )
          .is(
            "archived_at",
            null,
          )
          .maybeSingle();

        const message =
          explicitMemoryCommand
            .language === "id"
            ? `Ini sudah saya ingat: "${commandValue}".`
            : `I already remember this: "${commandValue}".`;

        return respondToMemoryCommand(
          message,
          {
            action:
              "remember",
            status:
              "already_exists",
            memoryId:
              existingMemory
                ?.id ??
              null,
          },
        );
      }

      const message =
        explicitMemoryCommand
          .language === "id"
          ? `Siap, saya akan mengingat ini: "${commandValue}".`
          : `Got it. I'll remember this: "${commandValue}".`;

      return respondToMemoryCommand(
        message,
        {
          action:
            "remember",
          status:
            "created",
          memoryId:
            memory?.id ??
            null,
          memoryType,
        },
      );
    }

    const normalizedForgetQuery =
      normalizeMemorySearchText(
        commandValue,
      );

    if (
      normalizedForgetQuery ===
        "semua" ||
      normalizedForgetQuery ===
        "all" ||
      normalizedForgetQuery ===
        "everything"
    ) {
      const message =
        explicitMemoryCommand
          .language === "id"
          ? "Untuk keamanan, saya tidak menghapus semua memory sekaligus lewat chat. Sebutkan memory yang ingin dilupakan."
          : "For safety, I won't delete every memory at once through chat. Please specify which memory to forget.";

      return respondToMemoryCommand(
        message,
        {
          action:
            "forget",
          status:
            "bulk_not_allowed",
        },
      );
    }

    const {
      data:
        activeMemories,
      error:
        memoriesError,
    } = await supabase
      .from("ai_memories")
      .select(
        "id, memory_type, memory_key, content",
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .eq(
        "user_id",
        user.id,
      )
      .is(
        "archived_at",
        null,
      )
      .order(
        "updated_at",
        {
          ascending:
            false,
        },
      )
      .limit(100);

    if (memoriesError) {
      logAiChatFailure({
        operation:
          "explicit_memory_forget_load",
        requestId:
          clientRequestId,
        error:
          memoriesError,
      });

      return NextResponse.json(
        {
          error:
            "Memory AI tidak dapat diperiksa.",
        },
        {
          status: 500,
        },
      );
    }

    const matches =
      findMatchingMemories(
        (
          activeMemories ??
          []
        ) as MemoryCandidate[],
        commandValue,
      );

    if (
      matches.length === 0
    ) {
      const message =
        explicitMemoryCommand
          .language === "id"
          ? `Saya belum menemukan memory aktif yang cocok dengan "${commandValue}".`
          : `I couldn't find an active memory matching "${commandValue}".`;

      return respondToMemoryCommand(
        message,
        {
          action:
            "forget",
          status:
            "not_found",
        },
      );
    }

    if (
      matches.length > 1
    ) {
      const message =
        explicitMemoryCommand
          .language === "id"
          ? "Saya menemukan lebih dari satu memory yang cocok. Sebutkan lebih spesifik mana yang ingin dilupakan."
          : "I found more than one matching memory. Please be more specific about which one to forget.";

      return respondToMemoryCommand(
        message,
        {
          action:
            "forget",
          status:
            "ambiguous",
          matchCount:
            matches.length,
        },
      );
    }

    const memoryToForget =
      matches[0];

    const {
      data:
        deletedMemory,
      error:
        deleteError,
    } = await supabase
      .from("ai_memories")
      .delete()
      .eq(
        "id",
        memoryToForget.id,
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .eq(
        "user_id",
        user.id,
      )
      .select("id")
      .maybeSingle();

    if (deleteError) {
      logAiChatFailure({
        operation:
          "explicit_memory_forget_delete",
        requestId:
          clientRequestId,
        error:
          deleteError,
      });

      return NextResponse.json(
        {
          error:
            "Memory AI tidak dapat dilupakan.",
        },
        {
          status: 500,
        },
      );
    }

    if (!deletedMemory) {
      return NextResponse.json(
        {
          error:
            "Memory AI tidak ditemukan.",
        },
        {
          status: 404,
        },
      );
    }

    const message =
      explicitMemoryCommand
        .language === "id"
        ? `Sudah saya lupakan: "${memoryToForget.content}".`
        : `I've forgotten this: "${memoryToForget.content}".`;

    return respondToMemoryCommand(
      message,
      {
        action:
          "forget",
        status:
          "deleted",
        memoryId:
          memoryToForget.id,
      },
    );
  }
  const [
    productsResult,
    productsCountResult,
    nonpositiveStockCountResult,
    nonpositivePriceCountResult,
    ordersResult,
    ordersCountResult,
    customersResult,
    priceTargetsResult,
    priceObservationsResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, sku, price, cost_price, stock, status",
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .limit(30),

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
        "status, total, created_at",
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(30),

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
      .from("customers")
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
      .from("price_monitor_targets")
      .select(
        "id, name, product_id, variant_id, source_name, currency, comparison_basis, direction, threshold_percent, is_active",
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .limit(30),

    supabase
      .from("price_observations")
      .select(
        "id, target_id, observed_price, internal_price_snapshot, previous_price, change_percent, difference_from_internal_percent, threshold_triggered, observed_at",
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .order(
        "observed_at",
        {
          ascending: false,
        },
      )
      .limit(50),
  ]);

  const contextError =
    productsResult.error ??
    productsCountResult.error ??
    nonpositiveStockCountResult.error ??
    nonpositivePriceCountResult.error ??
    ordersResult.error ??
    ordersCountResult.error ??
    customersResult.error ??
    priceTargetsResult.error ??
    priceObservationsResult.error;

  if (contextError) {
    return NextResponse.json(
      {
        error:
          "Business context tidak dapat dimuat.",
      },
      {
        status: 500,
      },
    );
  }

  const products =
    productsResult.data ?? [];

  const recentOrders =
    ordersResult.data ?? [];

  const commerceAnalyticsResult =
    await supabase.rpc(
      "get_commerce_analytics",
      {
        p_organization_id:
          currentOrganization.organizationId,
        p_days: 30,
      },
    );

  const productPerformanceResult =
    await supabase.rpc(
      "get_product_performance",
      {
        p_organization_id:
          currentOrganization.organizationId,
        p_product_id: null,
      },
    );
  const salesIntelligence =
    buildSalesIntelligenceContext({
      analytics:
        commerceAnalyticsResult.error
          ? null
          : commerceAnalyticsResult.data,
    });

  const productInventoryIntelligence =
    buildProductInventoryIntelligenceContext({
      analytics:
        commerceAnalyticsResult.error
          ? null
          : commerceAnalyticsResult.data,

      productPerformance:
        productPerformanceResult.error
          ? null
          : productPerformanceResult.data,
    });

  const businessIntelligenceSynthesis =
    buildBusinessIntelligenceSynthesis({
      salesIntelligence,
      productInventoryIntelligence,
    });
  const baseBusinessContext =
    buildBusinessContext({
      generatedAt:
        new Date().toISOString(),

      products,

      productTotalCount:
        productsCountResult.count,

      nonpositiveStockCount:
        nonpositiveStockCountResult.count,

      nonpositivePriceCount:
        nonpositivePriceCountResult.count,

      recentOrders,

      orderTotalCount:
        ordersCountResult.count,

      customerTotalCount:
        customersResult.count,

      priceTargets:
        priceTargetsResult.data ?? [],

      priceObservations:
        priceObservationsResult.data ?? [],
    });

  const businessContext = {
    ...baseBusinessContext,

    sales_intelligence:
      salesIntelligence,

    product_inventory_intelligence:
      productInventoryIntelligence,

    business_intelligence_synthesis:
      businessIntelligenceSynthesis,
  };
  const businessProfileResult =
    await supabase
      .from(
        "ai_business_profiles",
      )
      .select(
        [
          "industry",
          "business_type",
          "sales_model",
          "primary_market",
          "primary_sales_channels",
          "pricing_strategy",
          "primary_goal",
          "operational_priorities",
          "business_description",
          "updated_at",
        ].join(", "),
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .maybeSingle();

  if (
    businessProfileResult.error
  ) {
    console.error(
      "Failed to load AI business profile for chat context.",
      {
        organizationId,
        userId: user.id,
        error:
          businessProfileResult.error,
      },
    );
  }

  const businessProfile =
    (
      businessProfileResult.error
        ? null
        : businessProfileResult.data ??
          null
    ) as unknown as
      | BusinessProfileContextRow
      | null;

  const businessProfileContext =
    buildBusinessProfileContext({
      generatedAt:
        new Date().toISOString(),

      profile:
        businessProfile,
    });
  const activeMemoriesResult =
    await supabase
      .from("ai_memories")
      .select(
        [
          "id",
          "memory_type",
          "memory_key",
          "content",
          "source_kind",
          "updated_at",
        ].join(", "),
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .eq(
        "user_id",
        user.id,
      )
      .is(
        "archived_at",
        null,
      )
      .order(
        "updated_at",
        {
          ascending: false,
        },
      )
      .limit(30);

  if (
    activeMemoriesResult.error
  ) {
    console.error(
      "Failed to load active AI memories for chat context.",
      {
        organizationId,
        userId: user.id,
        error:
          activeMemoriesResult.error,
      },
    );
  }

  const activeMemories =
    (
      activeMemoriesResult.error
        ? []
        : activeMemoriesResult.data ??
          []
    ) as unknown as
      ActiveMemoryContextRow[];

  const memoryContext =
    buildMemoryContext({
      generatedAt:
        new Date().toISOString(),

      activeMemories,
    });
  const loadedAgentAdvisoryContext =
    agentAdvisoryReference === null
      ? null
      : await loadAssistantAgentAdvisoryContext({
          organizationId,

          agentId:
            agentAdvisoryReference.agentId,

          runId:
            agentAdvisoryReference.runId,

          dependencies: {
            loadCandidate:
              async ({
                organizationId:
                  scopedOrganizationId,
                agentId,
              }) => {
                const {
                  data,
                  error,
                } = await supabase
                  .from("ai_agents")
                  .select(
                    "id, name, purpose, approved_contexts, is_active",
                  )
                  .eq("id", agentId)
                  .eq(
                    "organization_id",
                    scopedOrganizationId,
                  )
                  .maybeSingle();

                return {
                  data,
                  error,
                };
              },

            loadRun:
              async ({
                organizationId:
                  scopedOrganizationId,
                agentId,
                runId,
              }) => {
                const {
                  data,
                  error,
                } = await supabase
                  .from("ai_agent_runs")
                  .select(
                    "id, agent_id, status, objective, summary, recommendation, risks, next_actions",
                  )
                  .eq("id", runId)
                  .eq("agent_id", agentId)
                  .eq(
                    "organization_id",
                    scopedOrganizationId,
                  )
                  .maybeSingle();

                return {
                  data,
                  error,
                };
              },
          },
        });

  const assistantAgentAdvisoryContext =
    loadedAgentAdvisoryContext?.available ===
    true
      ? loadedAgentAdvisoryContext
      : null;
  const proactiveInsightContext =
    buildProactiveInsightContext(
      proactiveInsightCode,
    );

  const model =
    process.env
      .OPENAI_ASSISTANT_MODEL
      ?.trim() ||
    process.env
      .OPENAI_MODEL
      ?.trim() ||
    "gpt-5.6-luna";

  const systemMessages =
    buildAssistantSystemMessages({
      businessContext,
      businessProfileContext,
      memoryContext,
      agentAdvisoryContext:
        assistantAgentAdvisoryContext,
      proactiveInsightContext,
    });

  try {
    const {
      response,
      data: responseData,
    } =
      await createOpenAIChatCompletion({
        apiKey,
        model,
        messages: [
          ...systemMessages,
          ...messages,
        ],
      });

    const requestId =
      response.headers.get(
        "x-request-id",
      );

    if (!response.ok) {
      await recordOpenAIChatUsageSafely({
        organizationId,
        userId: user.id,

        feature:
          "ai_assistant",

        requestedModel:
          model,

        sourceKind:
          "ai_assistant_chat",

        responseData,

        requestIdHeader:
          requestId,

        requestStatus:
          "failed",

        metadata: {
          http_status:
            response.status,

          message_count:
            messages.length,
        },
      });

      return NextResponse.json(
        {
          error:
            responseData
              .error
              ?.message ??
            "AI Assistant request gagal.",
        },
        {
          status: 502,
        },
      );
    }

    await recordOpenAIChatUsageSafely({
      organizationId,
      userId: user.id,

      feature:
        "ai_assistant",

      requestedModel:
        model,

      sourceKind:
        "ai_assistant_chat",

      responseData,

      requestIdHeader:
        requestId,

      requestStatus:
        "completed",

      metadata: {
        message_count:
          messages.length,
      },
    });

    const content =
      responseData
        .choices?.[0]
        ?.message
        ?.content
        ?.trim();

    if (!content) {
      return NextResponse.json(
        {
          error:
            "AI Assistant tidak mengembalikan jawaban.",
        },
        {
          status: 502,
        },
      );
    }

    if (conversationId) {
      const assistantMessageAt =
        new Date().toISOString();

      const {
        error: assistantMessageError,
      } = await supabase
        .from("ai_conversation_messages")
        .insert({
          conversation_id:
            conversationId,

          organization_id:
            organizationId,

          user_id:
            user.id,

          role:
            "assistant",

          content,

          created_at:
            assistantMessageAt,
        });

      if (assistantMessageError) {
        console.error(
          "Failed to persist AI assistant message.",
          {
            conversationId,
            organizationId,
            userId: user.id,
            error: assistantMessageError,
          },
        );

        return NextResponse.json(
          {
            error:
              "Jawaban AI tidak dapat disimpan.",
          },
          {
            status: 500,
          },
        );
      }

      const {
        error: touchError,
      } = await supabase
        .from("ai_conversations")
        .update({
          updated_at:
            assistantMessageAt,

          last_message_at:
            assistantMessageAt,
        })
        .eq(
          "id",
          conversationId,
        )
        .eq(
          "organization_id",
          organizationId,
        )
        .eq(
          "user_id",
          user.id,
        )
        .is(
          "archived_at",
          null,
        );

      if (touchError) {
        console.error(
          "Failed to update AI conversation timestamp.",
          {
            conversationId,
            organizationId,
            userId: user.id,
            error: touchError,
          },
        );
      }
    }

    return NextResponse.json({
      message: content,
      conversationId,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "AI Assistant sementara tidak tersedia.",
      },
      {
        status: 502,
      },
    );
  }
}
