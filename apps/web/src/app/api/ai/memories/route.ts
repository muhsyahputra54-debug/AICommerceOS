import { NextResponse } from "next/server";

import {
  logAiMemoryFailure,
} from "@/lib/ai/ai-memory-observability";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

const MAX_MEMORY_KEY_LENGTH = 120;
const MAX_MEMORY_CONTENT_LENGTH = 2000;

const MEMORY_TYPES = [
  "preference",
  "goal",
  "constraint",
  "business_context",
] as const;

const MEMORY_SOURCE_KINDS = [
  "explicit_user",
  "user_confirmed",
] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type MemoryType =
  (typeof MEMORY_TYPES)[number];

type MemorySourceKind =
  (typeof MEMORY_SOURCE_KINDS)[number];

type CreateMemoryBody = {
  memoryType?: unknown;
  memoryKey?: unknown;
  content?: unknown;
  sourceKind?: unknown;
  sourceConversationId?: unknown;
};

function normalizeMemoryKey(
  value: unknown,
) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

  if (
    !normalized ||
    normalized.length >
      MAX_MEMORY_KEY_LENGTH ||
    !/^[a-z0-9][a-z0-9._-]*$/.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized;
}

function normalizeContent(
  value: unknown,
) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  if (
    !normalized ||
    normalized.length >
      MAX_MEMORY_CONTENT_LENGTH
  ) {
    return null;
  }

  return normalized;
}

function normalizeMemoryType(
  value: unknown,
): MemoryType | null {
  if (
    typeof value !== "string" ||
    !MEMORY_TYPES.includes(
      value as MemoryType,
    )
  ) {
    return null;
  }

  return value as MemoryType;
}

function normalizeSourceKind(
  value: unknown,
): MemorySourceKind | null {
  if (value === undefined) {
    return "explicit_user";
  }

  if (
    typeof value !== "string" ||
    !MEMORY_SOURCE_KINDS.includes(
      value as MemorySourceKind,
    )
  ) {
    return null;
  }

  return value as MemorySourceKind;
}

function normalizeSourceConversationId(
  value: unknown,
) {
  if (
    value === undefined ||
    value === null
  ) {
    return {
      valid: true,
      value: null,
    } as const;
  }

  if (
    typeof value !== "string"
  ) {
    return {
      valid: false,
      value: null,
    } as const;
  }

  const normalized =
    value.trim();

  if (
    !UUID_PATTERN.test(
      normalized,
    )
  ) {
    return {
      valid: false,
      value: null,
    } as const;
  }

  return {
    valid: true,
    value: normalized,
  } as const;
}

async function getRequestContext() {
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
    user,
    organizationId,
  } = context;

  const includeArchived =
    new URL(
      request.url,
    ).searchParams.get(
      "includeArchived",
    ) === "true";

  const memorySelect =
    [
      "id",
      "memory_type",
      "memory_key",
      "content",
      "source_kind",
      "source_conversation_id",
      "created_at",
      "updated_at",
      "last_used_at",
      "archived_at",
    ].join(", ");

  const baseQuery =
    supabase
      .from("ai_memories")
      .select(
        memorySelect,
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .eq(
        "user_id",
        user.id,
      );

  const memoryQuery =
    includeArchived
      ? baseQuery
      : baseQuery.is(
          "archived_at",
          null,
        );

  const {
    data: memories,
    error,
  } = await memoryQuery
    .order(
      "updated_at",
      {
        ascending: false,
      },
    )
    .limit(100);

  if (error) {
    logAiMemoryFailure({
      operation:
        "memory_list",
      requestId,
      error,
    });

    return NextResponse.json(
      {
        error:
          "Memory AI tidak dapat dimuat.",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    memories:
      memories ?? [],
  });
}

export async function POST(
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

  const body =
    (await request
      .json()
      .catch(
        () => ({}),
      )) as CreateMemoryBody;

  const memoryType =
    normalizeMemoryType(
      body.memoryType,
    );

  const memoryKey =
    normalizeMemoryKey(
      body.memoryKey,
    );

  const content =
    normalizeContent(
      body.content,
    );

  const sourceKind =
    normalizeSourceKind(
      body.sourceKind,
    );

  const sourceConversation =
    normalizeSourceConversationId(
      body.sourceConversationId,
    );

  if (
    !memoryType ||
    !memoryKey ||
    !content ||
    !sourceKind ||
    !sourceConversation.valid
  ) {
    return NextResponse.json(
      {
        error:
          "Data memory AI tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    sourceConversation.value
  ) {
    const {
      data: conversation,
      error: conversationError,
    } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq(
        "id",
        sourceConversation.value,
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .eq(
        "user_id",
        user.id,
      )
      .maybeSingle();

    if (conversationError) {
      logAiMemoryFailure({
        operation:
          "memory_source_conversation_validate_create",
        requestId,
        error:
          conversationError,
      });

      return NextResponse.json(
        {
          error:
            "Sumber percakapan memory tidak dapat divalidasi.",
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
            "Sumber percakapan tidak ditemukan.",
        },
        {
          status: 404,
        },
      );
    }
  }

  const {
    data: memory,
    error,
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

      content,

      source_kind:
        sourceKind,

      source_conversation_id:
        sourceConversation.value,
    })
    .select(
      [
        "id",
        "memory_type",
        "memory_key",
        "content",
        "source_kind",
        "source_conversation_id",
        "created_at",
        "updated_at",
        "last_used_at",
        "archived_at",
      ].join(", "),
    )
    .single();

  if (error) {
    if (
      error.code === "23505"
    ) {
      return NextResponse.json(
        {
          error:
            "Memory aktif dengan key tersebut sudah ada.",
        },
        {
          status: 409,
        },
      );
    }

    logAiMemoryFailure({
      operation:
        "memory_create",
      requestId,
      error,
    });

    return NextResponse.json(
      {
        error:
          "Memory AI tidak dapat dibuat.",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json(
    {
      memory,
    },
    {
      status: 201,
    },
  );
}