import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Order received",
  description: "Manual payment order confirmation.",
};

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    order?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { order } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader>
	          <CardTitle>Order received</CardTitle>
	          <CardDescription>
	            Manual payment required. This order is pending confirmation.
	          </CardDescription>
	        </CardHeader>
	        <CardContent>
	          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
	            <p className="text-sm font-semibold text-amber-900">
	              This is not an online payment receipt.
	            </p>
	            <p className="mt-2 text-sm leading-6 text-amber-900">
	              Your order has been created with pending status. Our team will
	              review it and send manual payment instructions before the order
	              is processed.
	            </p>
	          </div>
	          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
	            <p className="text-sm font-medium text-slate-600">
	              Order number
	            </p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-950">
              {order ?? "Unavailable"}
            </p>
	            <p className="mt-3 text-sm leading-6 text-slate-600">
	              We have received your order, but payment has not been completed
	              online.
	            </p>
	            <p className="mt-3 text-sm leading-6 text-slate-600">
	              我們已收到您的訂單，但尚未完成線上付款。付款方式將由客服確認後通知。
	            </p>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/">Back home</Link>
            </Button>
            <Button asChild>
              <Link href="/account/orders">View my orders</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
