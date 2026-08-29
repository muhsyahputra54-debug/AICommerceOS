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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateMemoryBody = {
  memoryType?: unknown;
  memoryKey?: unknown;
  content?: unknown;
  sourceKind?: unknown;
  sourceConversationId?: unknown;
  archived?: unknown;
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
  if (value === null) {
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

async function validateSourceConversation({
  supabase,
  conversationId,
  organizationId,
  userId,
}: {
  supabase:
    Awaited<
      ReturnType<
        typeof createClient
      >
    >;

  conversationId:
    string;

  organizationId:
    string;

  userId:
    string;
}) {
  const {
    data: conversation,
    error,
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
      userId,
    )
    .maybeSingle();

  return {
    conversation,
    error,
  };
}

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  const requestId =
    request.headers.get(
      "x-request-id",
    );

  const {
    id,
  } = await params;

  if (
    !UUID_PATTERN.test(id)
  ) {
    return NextResponse.json(
      {
        error:
          "Memory ID tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

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

  const {
    data: memory,
    error,
  } = await supabase
    .from("ai_memories")
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
    .eq(
      "id",
      id,
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

  if (error) {
    logAiMemoryFailure({
      operation:
        "memory_load",
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

  if (!memory) {
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

  return NextResponse.json({
    memory,
  });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  const requestId =
    request.headers.get(
      "x-request-id",
    );

  const {
    id,
  } = await params;

  if (
    !UUID_PATTERN.test(id)
  ) {
    return NextResponse.json(
      {
        error:
          "Memory ID tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

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
      )) as UpdateMemoryBody;

  const updates:
    Record<string, unknown> = {};

  if (
    body.memoryType !== undefined
  ) {
    const memoryType =
      normalizeMemoryType(
        body.memoryType,
      );

    if (!memoryType) {
      return NextResponse.json(
        {
          error:
            "Memory type tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    updates.memory_type =
      memoryType;
  }

  if (
    body.memoryKey !== undefined
  ) {
    const memoryKey =
      normalizeMemoryKey(
        body.memoryKey,
      );

    if (!memoryKey) {
      return NextResponse.json(
        {
          error:
            "Memory key tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    updates.memory_key =
      memoryKey;
  }

  if (
    body.content !== undefined
  ) {
    const content =
      normalizeContent(
        body.content,
      );

    if (!content) {
      return NextResponse.json(
        {
          error:
            "Isi memory tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    updates.content =
      content;
  }

  if (
    body.sourceKind !== undefined
  ) {
    const sourceKind =
      normalizeSourceKind(
        body.sourceKind,
      );

    if (!sourceKind) {
      return NextResponse.json(
        {
          error:
            "Memory source kind tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    updates.source_kind =
      sourceKind;
  }

  if (
    body.sourceConversationId !==
      undefined
  ) {
    const sourceConversation =
      normalizeSourceConversationId(
        body.sourceConversationId,
      );

    if (
      !sourceConversation.valid
    ) {
      return NextResponse.json(
        {
          error:
            "Source conversation ID tidak valid.",
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
        conversation,
        error:
          conversationError,
      } =
        await validateSourceConversation({
          supabase,
          conversationId:
            sourceConversation.value,
          organizationId,
          userId:
            user.id,
        });

      if (conversationError) {
        logAiMemoryFailure({
          operation:
            "memory_source_conversation_validate_update",
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

    updates.source_conversation_id =
      sourceConversation.value;
  }

  if (
    body.archived !== undefined
  ) {
    if (
      typeof body.archived !==
        "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Status archive tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    updates.archived_at =
      body.archived
        ? new Date().toISOString()
        : null;
  }

  if (
    Object.keys(updates).length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "Tidak ada perubahan memory.",
      },
      {
        status: 400,
      },
    );
  }

  updates.updated_at =
    new Date().toISOString();

  const {
    data: memory,
    error,
  } = await supabase
    .from("ai_memories")
    .update(updates)
    .eq(
      "id",
      id,
    )
    .eq(
      "organization_id",
      organizationId,
    )
    .eq(
      "user_id",
      user.id,
    )
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
    .maybeSingle();

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
        "memory_update",
      requestId,
      error,
    });

    return NextResponse.json(
      {
        error:
          "Memory AI tidak dapat diperbarui.",
      },
      {
        status: 500,
      },
    );
  }

  if (!memory) {
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

  return NextResponse.json({
    memory,
  });
}

export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  const requestId =
    request.headers.get(
      "x-request-id",
    );

  const {
    id,
  } = await params;

  if (
    !UUID_PATTERN.test(id)
  ) {
    return NextResponse.json(
      {
        error:
          "Memory ID tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

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

  const {
    data: deletedMemory,
    error,
  } = await supabase
    .from("ai_memories")
    .delete()
    .eq(
      "id",
      id,
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

  if (error) {
    logAiMemoryFailure({
      operation:
        "memory_delete",
      requestId,
      error,
    });

    return NextResponse.json(
      {
        error:
          "Memory AI tidak dapat dihapus.",
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

  return NextResponse.json({
    deleted: true,
    id:
      deletedMemory.id,
  });
}