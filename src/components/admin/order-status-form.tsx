"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const textareaClassName = cn(
  "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

export function OrderStatusForm({
  orderId,
  status,
  adminNote,
  adminNoteSupported = true,
}: {
  orderId: string;
  status: string;
  adminNote?: string | null;
  adminNoteSupported?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: String(formData.get("status") ?? ""),
        ...(adminNoteSupported
          ? { adminNote: String(formData.get("adminNote") ?? "").trim() }
          : {}),
      }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Unable to update order status.");
      setIsSubmitting(false);
      return;
    }

    router.refresh();
    setIsSubmitting(false);
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <select name="status" defaultValue={status} className={selectClassName}>
        <option value="pending">Pending</option>
        <option value="paid">Paid</option>
        <option value="cancelled">Cancelled</option>
        <option value="fulfilled">Fulfilled</option>
      </select>
      {adminNoteSupported ? (
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Admin note
          <textarea
            name="adminNote"
            defaultValue={adminNote ?? ""}
            placeholder="Internal note for the team"
            className={textareaClassName}
          />
        </label>
      ) : (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Admin notes are unavailable until the orders admin_note database column
          is added.
        </p>
      )}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update status"}
      </Button>
    </form>
  );
}
