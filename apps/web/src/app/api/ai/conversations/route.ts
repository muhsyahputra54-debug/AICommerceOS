import { NextResponse } from "next/server";

import {
  logAiPersistenceFailure,
} from "@/lib/ai/ai-persistence-observability";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

const MAX_TITLE_LENGTH = 120;

type CreateConversationBody = {
  title?: unknown;
  firstMessage?: unknown;
};

function normalizeTitle(
  value: unknown,
) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value
      .replace(/\s+/g, " ")
      .trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(
    0,
    MAX_TITLE_LENGTH,
  );
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

  const {
    data: conversation,
    error,
  } = await supabase
    .from("ai_conversations")
    .select(
      "id, title, created_at, updated_at, last_message_at",
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
      "last_message_at",
      {
        ascending: false,
      },
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    logAiPersistenceFailure({
      operation:
        "conversation_load_latest",
      requestId,
      error,
    });

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

  return NextResponse.json({
    conversation:
      conversation ?? null,
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
      )) as CreateConversationBody;

  const title =
    normalizeTitle(
      body.title,
    ) ??
    normalizeTitle(
      body.firstMessage,
    );

  if (!title) {
    return NextResponse.json(
      {
        error:
          "Judul atau pesan pertama diperlukan.",
      },
      {
        status: 400,
      },
    );
  }

  const now =
    new Date().toISOString();

  const {
    data: conversation,
    error,
  } = await supabase
    .from("ai_conversations")
    .insert({
      organization_id:
        organizationId,

      user_id:
        user.id,

      title,

      updated_at:
        now,

      last_message_at:
        now,
    })
    .select(
      "id, title, created_at, updated_at, last_message_at",
    )
    .single();

  if (error) {
    logAiPersistenceFailure({
      operation:
        "conversation_create",
      requestId,
      error,
    });

    return NextResponse.json(
      {
        error:
          "Percakapan AI tidak dapat dibuat.",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json(
    {
      conversation,
    },
    {
      status: 201,
    },
  );
}