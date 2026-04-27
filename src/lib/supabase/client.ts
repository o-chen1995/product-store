"use client";

import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import { authCookieName } from "@/lib/auth-cookie";

let browserSupabaseClient: ReturnType<typeof createClient> | null = null;

export function syncSupabaseSessionCookie(session: Session | null) {
  if (typeof document === "undefined") {
    return;
  }

  if (!session?.access_token) {
    document.cookie = `${authCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }

  document.cookie = `${authCookieName}=${encodeURIComponent(
    session.access_token,
  )}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  browserSupabaseClient ??= createClient(supabaseUrl, supabaseAnonKey);

  return browserSupabaseClient;
}
