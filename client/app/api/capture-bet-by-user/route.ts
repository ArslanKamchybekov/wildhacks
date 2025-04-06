import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectToDatabase } from "@/lib/db";
import { Bet } from "@/models/bet.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

export async function POST(request: NextRequest) {
  try {
    // Extract userId from the request body
    const { userId } = await request.json();
    if (!userId) {
      throw new Error("No userId provided.");
    }

    // 1) Connect to DB
    await connectToDatabase();

    // 2) Find the user's Bet that is "authorized"
    //    (Assuming a user can only have one authorized bet at a time)
    const bet = await Bet.findOne({ userId, status: "authorized" });
    if (!bet) {
      throw new Error(`No authorized bet found for userId: ${userId}.`);
    }

    // 3) Capture the PaymentIntent on Stripe
    const paymentIntent = await stripe.paymentIntents.capture(
      bet.paymentIntentId
    );

    // 4) Update the Bet to "captured"
    bet.status = "captured";
    await bet.save();

    // 5) Return success
    return NextResponse.json({
      message: "Bet captured successfully",
      paymentIntent,
      bet,
    });
  } catch (error: any) {
    console.error("Error capturing PaymentIntent:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
