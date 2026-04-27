import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  attachStripeCheckoutSession,
  getCheckoutOrder,
} from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  orderId: z.uuid(),
});

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
  }

  return siteUrl.replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Missing STRIPE_SECRET_KEY." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { orderId } = checkoutSchema.parse(body);
    const { order, items } = await getCheckoutOrder(orderId);

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending orders can be paid." },
        { status: 400 },
      );
    }

    const siteUrl = getSiteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: order.currency.toLowerCase(),
          product_data: {
            name: item.product_name,
          },
          unit_amount: item.unit_price,
        },
      })),
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?canceled=true`,
      metadata: {
        order_id: order.id,
        order_number: order.id,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a Checkout URL." },
        { status: 502 },
      );
    }

    await attachStripeCheckoutSession(order.id, session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid checkout data.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create Stripe Checkout Session.";
    const status = message.includes("not configured") ? 503 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
