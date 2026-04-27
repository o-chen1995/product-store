"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  createBrowserSupabaseClient,
  syncSupabaseSessionCookie,
} from "@/lib/supabase/client";

export function AuthNav() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setUser(data.session?.user ?? null);
      syncSupabaseSessionCookie(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      syncSupabaseSessionCookie(session);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    syncSupabaseSessionCookie(null);
    window.location.assign("/");
  }

  if (isLoading) {
    return (
      <span className="hidden text-sm font-medium text-slate-500 sm:inline">
        Account
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:text-slate-950"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/account"
        className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:text-slate-950"
      >
        My account
      </Link>
      <Button
        type="button"
        variant="ghost"
        className="h-10 rounded-full px-3"
        onClick={handleSignOut}
      >
        Sign out
      </Button>
    </div>
  );
}
