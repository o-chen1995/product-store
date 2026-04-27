import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { authCookieName } from "@/lib/auth-cookie";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  email: string;
  role: "user" | "admin";
};

function getBearerToken(authorization: string | null) {
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
}

function getCookieToken(cookieHeader: string | null) {
  return cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${authCookieName}=`))
    ?.slice(authCookieName.length + 1);
}

async function getUserFromToken(token: string | null) {
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

  return data.user;
}

async function getProfileForUser(user: User) {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase admin lookup is not configured.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load admin profile.");
  }

  return data as AdminProfile | null;
}

export async function getCurrentUserProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value ?? null;
  const user = await getUserFromToken(token);

  if (!user) {
    return null;
  }

  return getProfileForUser(user);
}

export async function requireAdmin(redirectTo = "/admin") {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value ?? null;
  const user = await getUserFromToken(token);

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }

  const profile = await getProfileForUser(user);

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return profile;
}

export async function requireAdminFromRequest(request: Request) {
  const authorizationToken = getBearerToken(request.headers.get("authorization"));
  const cookieToken = getCookieToken(request.headers.get("cookie"));
  const user = await getUserFromToken(authorizationToken ?? cookieToken ?? null);

  if (!user) {
    throw new Error("Authentication required.");
  }

  const profile = await getProfileForUser(user);

  if (profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return profile;
}
