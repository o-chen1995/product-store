import { NextResponse } from "next/server";
import Stripe from "stripe";
import { markOrderPaid } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Missing STRIPE_SECRET_KEY." },
        { status: 503 },
      );
    }

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Stripe webhook is not configured. Missing STRIPE_WEBHOOK_SECRET." },
        { status: 503 },
      );
    }

    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe-Signature header." },
        { status: 400 },
      );
    }

    const rawBody = await request.text();
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (!orderId) {
        return NextResponse.json(
          { error: "Checkout Session is missing order_id metadata." },
          { status: 400 },
        );
      }

      await markOrderPaid({
        orderId,
        checkoutSessionId: session.id,
        paymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null),
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to process Stripe webhook.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
