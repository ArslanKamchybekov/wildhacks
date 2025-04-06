import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Ensure you have your secret key in your environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();

    // The domain or base URL for your success/cancel pages.
    // In production, replace this with your actual domain, e.g. "https://myapp.com"
    const YOUR_DOMAIN =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Validate or sanitize the incoming amount if needed
    if (!amount || amount < 1) {
      throw new Error("Invalid amount");
    }

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment", // single payment
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount * 100, // e.g. 10 => 1000 cents
            product_data: {
              name: "Pet Bet",
              // optionally: description: "Bet for your pet's survival"
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${YOUR_DOMAIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/checkout/cancel`,
    });

    // Return the session URL so the client can redirect
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
