import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();

    if (!amount || amount < 1) {
      throw new Error("Invalid amount");
    }

    // create PaymentIntent in manual capture mode
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // from dollars to cents
      currency: "usd",
      payment_method_types: ["card"],
      capture_method: "manual",
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: any) {
    console.error("Error creating PaymentIntent:", err);
    return new NextResponse(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
