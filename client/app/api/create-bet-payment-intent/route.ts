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

    // Create a PaymentIntent in "manual" capture mode
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // convert dollars to cents (10 => 1000)
      currency: "usd",
      payment_method_types: ["card"],
      capture_method: "manual", // <--- Important for manual capture
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error("Error creating manual capture PaymentIntent:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
