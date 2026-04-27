"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function ProtectedAccount({
  children,
}: Readonly<{
  children: (user: User) => React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    if (!supabase) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;

      if (!sessionUser) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      setUser(sessionUser);
      setIsLoading(false);
    });
  }, [pathname, router, supabase]);

  if (isLoading || !user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-600">Checking account session...</p>
      </div>
    );
  }

  return <>{children(user)}</>;
}
