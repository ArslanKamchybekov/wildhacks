import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      throw new Error("No paymentIntentId provided");
    }

    // capture the authorized funds
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    return NextResponse.json({ paymentIntent });
  } catch (err: any) {
    console.error("Error capturing PaymentIntent:", err);
    return new NextResponse(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
