import { createClient } from "@/lib/supabase/server";

export async function ensureOrganization() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const { data, error } = await supabase.rpc(
    "create_default_organization",
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}