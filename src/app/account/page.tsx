"use client";

import Link from "next/link";
import { ProtectedAccount } from "@/components/auth/protected-account";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AccountPage() {
  return (
    <ProtectedAccount>
      {(user) => (
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Account
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              My account
            </h1>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Signed in with Supabase Auth.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="break-all text-sm font-medium text-slate-950">
                  {user.email}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>View orders linked to this account.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/account/orders">View my orders</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </ProtectedAccount>
  );
}
