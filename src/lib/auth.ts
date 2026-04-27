import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getUserIdFromAuthorizationHeader(authorization: string | null) {
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;

  if (!token) {
    return null;
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase auth is not configured.");
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}
