import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectToDatabase } from "@/lib/db";
import { Bet } from "@/models/bet.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

export async function POST(request: NextRequest) {
  try {
    // 1) Parse request body
    const { betId } = await request.json();
    if (!betId) {
      throw new Error("No betId provided.");
    }

    // 2) Connect to MongoDB
    await connectToDatabase();

    // 3) Find the Bet in the DB
    const bet = await Bet.findById(betId);
    if (!bet) {
      throw new Error(`No bet found for id: ${betId}`);
    }

    // Optional: verify the bet is still authorized
    if (bet.status !== "authorized") {
      throw new Error(`Cannot capture bet in status '${bet.status}'.`);
    }

    // 4) Capture the PaymentIntent on Stripe
    const paymentIntent = await stripe.paymentIntents.capture(
      bet.paymentIntentId
    );

    // 5) Update the Bet in the DB
    bet.status = "captured";
    await bet.save();

    // 6) Return a success response
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
