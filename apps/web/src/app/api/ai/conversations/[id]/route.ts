import { NextResponse } from "next/server";

import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
  _request: Request,
  { params }: RouteContext,
) {
  const {
    id,
  } = await params;

  if (!id) {
    return NextResponse.json(
      {
        error:
          "Conversation ID diperlukan.",
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
    data: conversation,
    error: conversationError,
  } = await supabase
    .from("ai_conversations")
    .select(
      "id, title, created_at, updated_at, last_message_at, archived_at",
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

  if (conversationError) {
    console.error(
      "Failed to load AI conversation.",
      {
        conversationId: id,
        organizationId,
        userId: user.id,
        error: conversationError,
      },
    );

    return NextResponse.json(
      {
        error:
          "Percakapan AI tidak dapat dimuat.",
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
          "Percakapan AI tidak ditemukan.",
      },
      {
        status: 404,
      },
    );
  }

  const {
    data: messages,
    error: messagesError,
  } = await supabase
    .from("ai_conversation_messages")
    .select(
      "id, role, content, created_at",
    )
    .eq(
      "conversation_id",
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
    .order(
      "created_at",
      {
        ascending: true,
      },
    )
    .order(
      "id",
      {
        ascending: true,
      },
    );

  if (messagesError) {
    console.error(
      "Failed to load AI conversation messages.",
      {
        conversationId: id,
        organizationId,
        userId: user.id,
        error: messagesError,
      },
    );

    return NextResponse.json(
      {
        error:
          "Pesan percakapan AI tidak dapat dimuat.",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    conversation,
    messages:
      messages ?? [],
  });
}

export async function PATCH(
  _request: Request,
  { params }: RouteContext,
) {
  const {
    id,
  } = await params;

  if (!id) {
    return NextResponse.json(
      {
        error:
          "Conversation ID diperlukan.",
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

  const now =
    new Date().toISOString();

  const {
    data: conversation,
    error,
  } = await supabase
    .from("ai_conversations")
    .update({
      archived_at:
        now,

      updated_at:
        now,
    })
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
    .is(
      "archived_at",
      null,
    )
    .select(
      "id, title, created_at, updated_at, last_message_at, archived_at",
    )
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to archive AI conversation.",
      {
        conversationId: id,
        organizationId,
        userId: user.id,
        error,
      },
    );

    return NextResponse.json(
      {
        error:
          "Percakapan AI tidak dapat diarsipkan.",
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
          "Percakapan aktif tidak ditemukan.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    conversation,
  });
}