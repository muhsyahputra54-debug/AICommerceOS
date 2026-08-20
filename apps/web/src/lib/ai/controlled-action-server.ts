import { NextResponse } from "next/server";

import {
  controlledActionRpcErrorStatus,
  projectControlledActionRecord,
} from "@/lib/ai/controlled-action-api";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient =
  Awaited<
    ReturnType<typeof createClient>
  >;

export async function getControlledActionRequestContext() {
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

  const role =
    String(
      currentOrganization.role ??
        "",
    );

  if (
    role !== "owner" &&
    role !== "admin"
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            "Controlled action hanya tersedia untuk owner atau admin.",
        },
        {
          status: 403,
        },
      ),
    } as const;
  }

  return {
    supabase,
    user,
    organizationId:
      currentOrganization.organizationId,
    role,
  } as const;
}

export function controlledActionRpcErrorResponse(
  message: string,
) {
  const status =
    controlledActionRpcErrorStatus(
      message,
    );

  let error =
    "Controlled action tidak dapat diproses.";

  if (status === 401) {
    error =
      "Authentication required.";
  } else if (status === 403) {
    error =
      "Anda tidak memiliki izin untuk controlled action ini.";
  } else if (status === 404) {
    error =
      "Controlled action atau target tidak ditemukan.";
  } else if (status === 409) {
    error =
      "Controlled action tidak dapat dilanjutkan karena state atau data telah berubah.";
  }

  return NextResponse.json(
    {
      error,
    },
    {
      status,
    },
  );
}

export async function readControlledAction(
  supabase: ServerSupabaseClient,
  organizationId: string,
  actionId: string,
) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_ai_controlled_action",
      {
        p_organization_id:
          organizationId,
        p_action_id:
          actionId,
      },
    );

  if (error) {
    return {
      error:
        controlledActionRpcErrorResponse(
          error.message,
        ),
    } as const;
  }

  if (data === null) {
    return {
      notFound: true,
    } as const;
  }

  const action =
    projectControlledActionRecord(
      data,
    );

  if (!action) {
    return {
      error: NextResponse.json(
        {
          error:
            "Controlled action response tidak valid.",
        },
        {
          status: 502,
        },
      ),
    } as const;
  }

  return {
    action,
  } as const;
}